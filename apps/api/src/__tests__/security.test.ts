import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

// Tests de sécurité dédiés : on démontre activement la résistance de l'API
// (injection SQL, XSS, contrôle d'accès) plutôt que de s'appuyer implicitement
// sur les protections de l'écosystème. Mêmes mocks déterministes que l'intégration.
vi.mock('../db/client.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    event: { create: vi.fn(), count: vi.fn(), findMany: vi.fn(), groupBy: vi.fn() },
  },
}));
vi.mock('../services/email.js', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendEbookEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../middleware/rateLimiter.js', () => ({
  rateLimiter: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import app from '../app.js';
import { prisma } from '../db/client.js';
import { signToken } from '../middleware/auth.js';

const p = prisma as unknown as {
  user: Record<string, ReturnType<typeof vi.fn>>;
  event: Record<string, ReturnType<typeof vi.fn>>;
};

beforeEach(() => vi.clearAllMocks());

describe('Sécurité — Injection SQL', () => {
  it("rejette une charge d'injection SQL dans l'email (400 Zod, jamais 500)", async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: "admin' OR '1'='1", password: "x' OR 1=1 --" });
    expect(res.status).toBe(400);
    expect(res.status).not.toBe(500);
  });

  it('ne plante jamais (500) sur un token de reset malveillant — requêtes paramétrées Prisma', async () => {
    p.user.findFirst.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: "'; DROP TABLE users; --", password: 'newpass123' });
    expect(res.status).toBe(400);
  });
});

describe('Sécurité — XSS', () => {
  it("accepte une charge XSS comme donnée sans planter (échappement à l'affichage)", async () => {
    p.user.findUnique.mockResolvedValue(null);
    p.user.create.mockResolvedValue({ id: 'u1', email: 'x@test.io', name: '<script>alert(1)</script>' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@test.io', password: 'secret123', name: '<script>alert(1)</script>' });
    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
  });

  it("rejette un type d'événement hors liste blanche (whitelist Zod)", async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${signToken('u1')}`)
      .send({ type: '<img src=x onerror=alert(1)>' });
    expect(res.status).toBe(400);
  });
});

describe("Sécurité — Contrôle d'accès (JWT)", () => {
  it('refuse une route protégée sans token (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('refuse un JWT falsifié (401)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not.a.valid.token');
    expect(res.status).toBe(401);
  });
});
