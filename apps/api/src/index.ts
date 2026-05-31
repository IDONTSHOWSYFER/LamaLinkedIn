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

// Applique les migrations Prisma au boot (le start Render bypasse migrate deploy). Échec non bloquant.
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

// Render route via un proxy : trust proxy rend req.ip fiable (rate-limiting par client réel).
app.set('trust proxy', 1);

const ALLOWED_ORIGINS = [
  'https://lamalinked.in',
  'https://www.lamalinked.in',
  'https://lama-linked-in-web.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

const EXTENSION_ID = process.env.EXTENSION_ID || 'mjabdegoelohpjfgcljlphoeffiafdpi';
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin === `chrome-extension://${EXTENSION_ID}` || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    if (!IS_PROD && (origin.startsWith('chrome-extension://') || origin.startsWith('http://localhost'))) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
}));

app.use(securityHeaders);
app.use(cacheControl);
app.use(performanceLogger);
app.use(rateLimiter({ maxRequests: 200, windowSeconds: 60, prefix: 'rl:global' }));
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
