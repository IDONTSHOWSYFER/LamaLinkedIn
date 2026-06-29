import { describe, it, expect } from 'vitest';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { cached, invalidateCache } from '../db/redis.js';

// Faux objet Response minimal pour tester un middleware Express isolément.
function mockRes() {
  return {
    statusCode: 200,
    headers: {} as Record<string, unknown>,
    body: null as unknown,
    setHeader(k: string, v: unknown) { this.headers[k] = v; },
    status(c: number) { this.statusCode = c; return this; },
    json(b: unknown) { this.body = b; return this; },
  };
}

describe('Rate limiter (NoSQL Redis, fail-open)', () => {
  it('laisse passer sous la limite puis renvoie 429', async () => {
    const mw = rateLimiter({ maxRequests: 2, windowSeconds: 60, prefix: 'rl:unit' });
    const req = { method: 'GET', ip: '9.9.9.9', socket: {} } as never;
    let passed = 0;
    const next = () => { passed += 1; };

    await mw(req, mockRes() as never, next);
    await mw(req, mockRes() as never, next);
    const r3 = mockRes();
    await mw(req, r3 as never, next);

    expect(passed).toBe(2);            // 2 requêtes passent
    expect(r3.statusCode).toBe(429);   // la 3e est limitée
    expect((r3.body as { message?: string })?.message).toBeTruthy();
  });

  it('ne limite jamais les préflight CORS (OPTIONS)', async () => {
    const mw = rateLimiter({ maxRequests: 1, windowSeconds: 60, prefix: 'rl:opt' });
    const req = { method: 'OPTIONS', ip: '1.1.1.1', socket: {} } as never;
    let passed = 0;
    await mw(req, mockRes() as never, () => { passed += 1; });
    await mw(req, mockRes() as never, () => { passed += 1; });
    expect(passed).toBe(2);
  });

  it('expose les en-têtes X-RateLimit-*', async () => {
    const mw = rateLimiter({ maxRequests: 5, windowSeconds: 60, prefix: 'rl:hdr' });
    const req = { method: 'GET', ip: '2.2.2.2', socket: {} } as never;
    const res = mockRes();
    await mw(req, res as never, () => {});
    expect(res.headers['X-RateLimit-Limit']).toBe(5);
    expect(res.headers['X-RateLimit-Remaining']).toBeDefined();
  });
});

describe('Cache Redis (cache-aside, store mémoire)', () => {
  it('MISS puis HIT : le fetcher n\'est exécuté qu\'une fois', async () => {
    let calls = 0;
    const fetcher = async () => { calls += 1; return { value: 42 }; };

    const a = await cached('k:unit', 60, fetcher);
    const b = await cached('k:unit', 60, fetcher); // doit venir du cache

    expect(a.value).toBe(42);
    expect(b.value).toBe(42);
    expect(calls).toBe(1);
  });

  it('invalidateCache force un nouveau MISS', async () => {
    let calls = 0;
    const fetcher = async () => { calls += 1; return { n: calls }; };

    await cached('k:inv', 60, fetcher);
    await invalidateCache('k:inv');
    await cached('k:inv', 60, fetcher);

    expect(calls).toBe(2);
  });
});
