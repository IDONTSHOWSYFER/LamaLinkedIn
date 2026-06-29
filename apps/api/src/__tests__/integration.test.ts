import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

// ── Mocks (hoistés) ──────────────────────────────────────────────
// Prisma : on mocke l'accès BDD pour des tests d'intégration déterministes
// (les handlers, la validation, l'auth et les middlewares s'exécutent réellement).
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
// Emails : no-op (pas d'appel réseau Resend en test).
vi.mock('../services/email.js', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendEbookEmail: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));
// Rate limiter : pass-through (déterminisme — pas de 429 parasite entre tests).
vi.mock('../middleware/rateLimiter.js', () => ({
  rateLimiter: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import bcrypt from 'bcryptjs';
import app from '../app.js';
import { prisma } from '../db/client.js';
import { signToken } from '../middleware/auth.js';

const p = prisma as unknown as {
  user: Record<string, ReturnType<typeof vi.fn>>;
  event: Record<string, ReturnType<typeof vi.fn>>;
};
const bearer = (id = 'user-1') => `Bearer ${signToken(id)}`;

beforeEach(() => vi.clearAllMocks());

describe('Intégration API — santé & authentification', () => {
  it('GET /api/health → 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/auth/register → 201 + token', async () => {
    p.user.findUnique.mockResolvedValue(null);
    p.user.create.mockResolvedValue({ id: 'u1', email: 'a@b.co', name: 'Alice' });
    const res = await request(app).post('/api/auth/register')
      .send({ email: 'a@b.co', password: 'secret123', name: 'Alice' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('a@b.co');
  });

  it('POST /api/auth/register email déjà utilisé → 409', async () => {
    p.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.co' });
    const res = await request(app).post('/api/auth/register')
      .send({ email: 'a@b.co', password: 'secret123', name: 'Alice' });
    expect(res.status).toBe(409);
  });

  it('POST /api/auth/register données invalides → 400', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ email: 'pas-un-email', password: '123' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login OK → 200 + token', async () => {
    const hash = await bcrypt.hash('secret123', 12);
    p.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.co', password: hash, name: 'Alice' });
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'a@b.co', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('POST /api/auth/login mauvais mot de passe → 401', async () => {
    const hash = await bcrypt.hash('secret123', 12);
    p.user.findUnique.mockResolvedValue({ id: 'u1', email: 'a@b.co', password: hash, name: 'Alice' });
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'a@b.co', password: 'MAUVAIS' });
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login email inconnu → 401 (réponse égalisée)', async () => {
    p.user.findUnique.mockResolvedValue(null);
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'x@y.co', password: 'peu-importe' });
    expect(res.status).toBe(401);
  });
});

describe('Intégration API — routes protégées (JWT)', () => {
  it('GET /api/auth/me sans token → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me avec token → 200', async () => {
    p.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'a@b.co', name: 'Alice', createdAt: new Date() });
    const res = await request(app).get('/api/auth/me').set('Authorization', bearer());
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('a@b.co');
  });

  it('GET /api/auth/me token invalide → 401', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer faux.jeton.invalide');
    expect(res.status).toBe(401);
  });

  it('PUT /api/auth/me met à jour le profil → 200', async () => {
    p.user.findUnique.mockResolvedValue(null);
    p.user.update.mockResolvedValue({ id: 'user-1', email: 'new@b.co', name: 'Alice', createdAt: new Date() });
    const res = await request(app).put('/api/auth/me').set('Authorization', bearer())
      .send({ email: 'new@b.co' });
    expect(res.status).toBe(200);
    expect(p.user.update).toHaveBeenCalled();
  });

  it('PUT /api/auth/password change le mot de passe → 200', async () => {
    const hash = await bcrypt.hash('ancien123', 12);
    p.user.findUnique.mockResolvedValue({ id: 'user-1', password: hash });
    p.user.update.mockResolvedValue({});
    const res = await request(app).put('/api/auth/password').set('Authorization', bearer())
      .send({ currentPassword: 'ancien123', newPassword: 'nouveau123' });
    expect(res.status).toBe(200);
  });

  it('DELETE /api/auth/me supprime le compte (RGPD) → 200', async () => {
    p.user.delete.mockResolvedValue({});
    const res = await request(app).delete('/api/auth/me').set('Authorization', bearer());
    expect(res.status).toBe(200);
  });
});

describe('Intégration API — mot de passe oublié (anti-énumération)', () => {
  it('POST /api/auth/forgot-password → 200 (réponse générique)', async () => {
    p.user.findUnique.mockResolvedValue({ id: 'user-1', email: 'a@b.co' });
    p.user.update.mockResolvedValue({});
    const res = await request(app).post('/api/auth/forgot-password').send({ email: 'a@b.co' });
    expect(res.status).toBe(200);
  });

  it('POST /api/auth/reset-password token valide → 200', async () => {
    p.user.findFirst.mockResolvedValue({ id: 'user-1' });
    p.user.update.mockResolvedValue({});
    const res = await request(app).post('/api/auth/reset-password')
      .send({ token: 'token-brut', password: 'nouveau123' });
    expect(res.status).toBe(200);
  });

  it('POST /api/auth/reset-password token invalide/expiré → 400', async () => {
    p.user.findFirst.mockResolvedValue(null);
    const res = await request(app).post('/api/auth/reset-password')
      .send({ token: 'mauvais', password: 'nouveau123' });
    expect(res.status).toBe(400);
  });
});

describe('Intégration API — événements & statistiques', () => {
  it('POST /api/events sans token → 401', async () => {
    const res = await request(app).post('/api/events').send({ type: 'like' });
    expect(res.status).toBe(401);
  });

  it('POST /api/events avec token → 201', async () => {
    p.event.create.mockResolvedValue({ id: 'e1', type: 'like', userId: 'user-1' });
    const res = await request(app).post('/api/events').set('Authorization', bearer())
      .send({ type: 'like', postId: 'p1' });
    expect(res.status).toBe(201);
    expect(p.event.create).toHaveBeenCalled();
  });

  it('POST /api/events type invalide → 400', async () => {
    const res = await request(app).post('/api/events').set('Authorization', bearer())
      .send({ type: 'invalide' });
    expect(res.status).toBe(400);
  });

  it('GET /api/events/stats avec token → 200 (cache Redis)', async () => {
    p.event.count.mockResolvedValue(5);
    p.event.findMany.mockResolvedValue([]);
    p.event.groupBy.mockResolvedValue([]);
    const res = await request(app).get('/api/events/stats?period=today').set('Authorization', bearer());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
  });

  it('GET /api/events liste paginée → 200', async () => {
    p.event.findMany.mockResolvedValue([]);
    const res = await request(app).get('/api/events').set('Authorization', bearer());
    expect(res.status).toBe(200);
  });
});

describe('Intégration API — lead magnet', () => {
  it('POST /api/lead valide → 200', async () => {
    const res = await request(app).post('/api/lead')
      .send({ email: 'a@b.co', firstName: 'Alice', consent: true });
    expect(res.status).toBe(200);
  });

  it('POST /api/lead invalide → 400', async () => {
    const res = await request(app).post('/api/lead').send({ email: 'pas-email' });
    expect(res.status).toBe(400);
  });
});
