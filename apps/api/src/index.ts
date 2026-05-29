import 'dotenv/config';
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import express, { type Express, Request, Response } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { leadRouter } from './routes/lead.js';
import { securityHeaders, cacheControl, performanceLogger } from './middleware/greenIt.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Apply any pending Prisma migrations on boot. Render's start command runs the
// compiled bundle directly and bypasses `prisma migrate deploy`, which once left
// the DB missing columns and 500'd every auth query. Running it here makes a
// fresh deploy self-heal regardless of how the process is launched. Failure is
// logged but never crashes boot.
function runMigrations(): void {
  try {
    const apiDir = dirname(__dirname); // dist/ -> apps/api
    const schemaPath = resolve(apiDir, 'prisma', 'schema.prisma');
    execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, { cwd: apiDir, stdio: 'inherit' });
    console.log('[Prisma] Migrations à jour');
  } catch (err) {
    console.error('[Prisma] migrate deploy a échoué (démarrage poursuivi) :', err instanceof Error ? err.message : err);
  }
}

const app: Express = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  'https://lamalinked.in',
  'https://www.lamalinked.in',
  'https://lama-linked-in-web.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

// ─── CORS en premier ────────────────────────────────────────────────────────
// Les préflights OPTIONS doivent répondre immédiatement, AVANT tout middleware
// potentiellement lent (rate limiter / Redis). Sinon chaque préflight paie la
// latence réseau inutilement.
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.startsWith('chrome-extension://') ||
        origin.startsWith('http://localhost') ||
        ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
}));

// ─── Sécurité & Green IT ───────────────────────────────────────────────────
app.use(securityHeaders);       // Headers OWASP (sécurité)
app.use(cacheControl);          // Cache-Control intelligent (éco-conception)
app.use(performanceLogger);     // Monitoring des requêtes lentes (éco-conception)

// Rate limiter global : 200 req/min par IP (protection DDoS, NoSQL/Redis)
app.use(rateLimiter({ maxRequests: 200, windowSeconds: 60, prefix: 'rl:global' }));

// Limite la taille du body JSON (éco-conception : évite les payloads abusifs)
app.use(express.json({ limit: '100kb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version: '1.0.0', greenIt: true });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/lead', leadRouter);

runMigrations();

app.listen(PORT, () => {
  console.log(`Lama Linked.In API running on port ${PORT}`);
});

export default app;
