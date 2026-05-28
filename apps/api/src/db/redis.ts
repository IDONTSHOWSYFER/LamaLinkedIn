/**
 * Redis client — Composant d'accès aux données NoSQL (résilient)
 *
 * Stratégie : Upstash Redis (serverless REST) si configuré, sinon store mémoire.
 * Toutes les opérations sont protégées par un timeout + un disjoncteur
 * (circuit breaker) : si Upstash devient injoignable, on bascule instantanément
 * sur le store mémoire pendant une période de repli, sans jamais bloquer la
 * requête HTTP. Une URL Upstash morte ne coûte donc qu'un seul timeout court
 * (et non un retry réseau sur chaque requête).
 *
 * Compétences CDA :
 * - Développer des composants d'accès aux données NoSQL
 * - Fiabiliser / sécuriser les composants serveur (résilience, dégradation gracieuse)
 * - Éco-conception : évite les retries réseau coûteux et inutiles
 */

import { Redis } from '@upstash/redis';

/** Contrat minimal commun à tous les backends (Upstash, mémoire, résilient). */
export interface RedisLike {
  get<T = string>(key: string): Promise<T | null>;
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown>;
  incr(key: string): Promise<number>;
  del(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
}

// ─── Réglages de résilience ────────────────────────────────────────────────
const OP_TIMEOUT_MS = 800;     // au-delà → Upstash considéré injoignable
const FAILURE_THRESHOLD = 2;   // échecs consécutifs avant ouverture du disjoncteur
const COOLDOWN_MS = 30_000;    // durée de repli mémoire avant nouvelle tentative

/** Rejette si la promesse ne se résout pas dans le délai imparti. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Redis op timeout (${ms}ms)`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

// Singleton du client effectif (résilient ou mémoire).
let client: RedisLike | null = null;

/**
 * Initialise et retourne le client Redis effectif.
 * - Upstash configuré → client résilient (disjoncteur + repli mémoire)
 * - Sinon → store mémoire
 */
export function getRedis(): RedisLike {
  if (client) return client;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const upstash = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      // Pas de retry SDK : la résilience est gérée par le disjoncteur ci-dessous,
      // ce qui évite l'attente cumulée des backoffs sur une URL morte.
      retry: false,
    });
    client = new ResilientRedis(upstash as unknown as RedisLike, InMemoryRedis.getInstance());
    console.log('[Redis] Upstash configuré (disjoncteur + repli mémoire actifs)');
  } else {
    client = InMemoryRedis.getInstance();
    console.log('[Redis] Mode mémoire (aucune URL Upstash configurée)');
  }
  return client;
}

/**
 * Décorateur résilient : tente l'opération sur le backend primaire (Upstash)
 * avec un timeout court ; en cas d'échec répété, ouvre le disjoncteur et sert
 * depuis le store mémoire pendant une période de repli.
 */
class ResilientRedis implements RedisLike {
  private failures = 0;
  private openUntil = 0;

  constructor(private primary: RedisLike, private fallback: RedisLike) {}

  private circuitOpen(): boolean {
    return Date.now() < this.openUntil;
  }

  private recordSuccess(): void {
    this.failures = 0;
    this.openUntil = 0;
  }

  private recordFailure(err: unknown): void {
    this.failures += 1;
    if (this.failures >= FAILURE_THRESHOLD && !this.circuitOpen()) {
      this.openUntil = Date.now() + COOLDOWN_MS;
      console.warn(
        `[Redis] Upstash injoignable — repli mémoire pendant ${COOLDOWN_MS / 1000}s :`,
        (err as Error)?.message ?? err,
      );
    }
  }

  private async run<T>(fn: (c: RedisLike) => Promise<T>): Promise<T> {
    // Disjoncteur ouvert → on sert directement depuis le store mémoire.
    if (this.circuitOpen()) return fn(this.fallback);

    try {
      const result = await withTimeout(fn(this.primary), OP_TIMEOUT_MS);
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure(err);
      // Dégradation gracieuse : on ne bloque jamais la requête HTTP.
      return fn(this.fallback);
    }
  }

  get<T = string>(key: string): Promise<T | null> { return this.run((c) => c.get<T>(key)); }
  set(key: string, value: unknown, opts?: { ex?: number }): Promise<unknown> { return this.run((c) => c.set(key, value, opts)); }
  incr(key: string): Promise<number> { return this.run((c) => c.incr(key)); }
  del(key: string): Promise<number> { return this.run((c) => c.del(key)); }
  expire(key: string, seconds: number): Promise<number> { return this.run((c) => c.expire(key, seconds)); }
  ttl(key: string): Promise<number> { return this.run((c) => c.ttl(key)); }
}

/**
 * Store mémoire (Map) — repli local implémentant le même contrat.
 * Suffisant pour un déploiement mono-instance (Render free tier).
 */
class InMemoryRedis implements RedisLike {
  private static instance: InMemoryRedis;
  private store = new Map<string, { value: string; expiresAt?: number }>();

  static getInstance(): InMemoryRedis {
    if (!InMemoryRedis.instance) {
      InMemoryRedis.instance = new InMemoryRedis();
    }
    return InMemoryRedis.instance;
  }

  async get<T = string>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return entry.value as unknown as T;
    }
  }

  async set(key: string, value: unknown, opts?: { ex?: number }): Promise<string> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    this.store.set(key, {
      value: serialized,
      expiresAt: opts?.ex ? Date.now() + opts.ex * 1000 : undefined,
    });
    return 'OK';
  }

  async incr(key: string): Promise<number> {
    const current = await this.get<number>(key);
    const next = (current || 0) + 1;
    const entry = this.store.get(key);
    this.store.set(key, { value: String(next), expiresAt: entry?.expiresAt });
    return next;
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return -2;
    if (!entry.expiresAt) return -1;
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }
}

// ─── Cache helpers ───────────────────────────────────────────────────────────

/**
 * Cache-aside : cherche dans Redis, sinon exécute le fetcher et met en cache.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const store = getRedis();

  try {
    const hit = await store.get<T>(key);
    if (hit !== null) return hit;
  } catch (err) {
    console.warn('[Redis] Cache read error:', err);
  }

  const result = await fetcher();

  try {
    await store.set(key, result, { ex: ttlSeconds });
  } catch (err) {
    console.warn('[Redis] Cache write error:', err);
  }

  return result;
}

/** Invalide une ou plusieurs clés de cache. */
export async function invalidateCache(...keys: string[]): Promise<void> {
  const store = getRedis();
  for (const key of keys) {
    try {
      await store.del(key);
    } catch (err) {
      console.warn('[Redis] Cache invalidation error:', err);
    }
  }
}
