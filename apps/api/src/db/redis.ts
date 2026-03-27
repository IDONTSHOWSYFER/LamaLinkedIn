/**
 * Redis client — Composant d'accès aux données NoSQL
 *
 * Utilise Upstash Redis (serverless) en production ou ioredis en local.
 * Fournit : rate limiting, cache de sessions, cache de stats.
 *
 * Compétence CDA : Développer des composants d'accès aux données SQL et NoSQL
 */

import { Redis } from '@upstash/redis';

// Singleton Redis client
let redis: Redis | null = null;

/**
 * Initialise et retourne le client Redis.
 * En production → Upstash (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
 * En dev sans Redis → fallback mémoire (Map)
 */
export function getRedis(): Redis | InMemoryRedis {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!redis) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      console.log('[Redis] Connected to Upstash Redis');
    }
    return redis;
  }

  // Fallback : in-memory store pour le dev
  return InMemoryRedis.getInstance();
}

/**
 * Fallback in-memory Redis-like store pour le développement local.
 * Implémente le même contrat que le client Redis.
 */
class InMemoryRedis {
  private static instance: InMemoryRedis;
  private store = new Map<string, { value: string; expiresAt?: number }>();

  static getInstance(): InMemoryRedis {
    if (!InMemoryRedis.instance) {
      InMemoryRedis.instance = new InMemoryRedis();
      console.log('[Redis] Using in-memory fallback (dev mode)');
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
    this.store.set(key, {
      value: String(next),
      expiresAt: entry?.expiresAt,
    });
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

  async hset(key: string, field: string, value: unknown): Promise<number> {
    const hash = (await this.get<Record<string, unknown>>(key)) || {};
    hash[field] = value;
    await this.set(key, hash);
    return 1;
  }

  async hget<T = string>(key: string, field: string): Promise<T | null> {
    const hash = await this.get<Record<string, unknown>>(key);
    if (!hash || !(field in hash)) return null;
    return hash[field] as T;
  }

  async hgetall<T = Record<string, string>>(key: string): Promise<T | null> {
    return this.get<T>(key);
  }
}

// ─── Cache helpers ─────────────────────────────────────────────────────────

/**
 * Cache-aside pattern : cherche dans Redis, sinon exécute la fonction
 * et met en cache le résultat avec un TTL.
 *
 * @param key - Clé Redis
 * @param ttlSeconds - Durée de vie en secondes
 * @param fetcher - Fonction qui génère la donnée
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const client = getRedis();

  // Essayer le cache
  try {
    const cached = await client.get<T>(key);
    if (cached !== null) {
      return cached;
    }
  } catch (err) {
    console.warn('[Redis] Cache read error:', err);
  }

  // Cache miss → fetch + store
  const result = await fetcher();

  try {
    await client.set(key, result, { ex: ttlSeconds });
  } catch (err) {
    console.warn('[Redis] Cache write error:', err);
  }

  return result;
}

/**
 * Invalide un ou plusieurs patterns de cache
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  const client = getRedis();
  for (const key of keys) {
    try {
      await client.del(key);
    } catch (err) {
      console.warn('[Redis] Cache invalidation error:', err);
    }
  }
}
