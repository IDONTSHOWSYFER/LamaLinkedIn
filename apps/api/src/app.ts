import express, { type Express, Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { leadRouter } from './routes/lead.js';
import { securityHeaders, cacheControl, performanceLogger } from './middleware/greenIt.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { openapiSpec } from './openapi.js';

// Application Express configurée (sans listen ni migrations) :
// importable telle quelle par les tests d'intégration (Supertest).
const app: Express = express();

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

// Documentation OpenAPI / Swagger (avant les en-têtes OWASP : la CSP stricte
// bloquerait les scripts inline de Swagger UI). Spec brute + UI interactive.
app.get('/api/openapi.json', (_req: Request, res: Response) => res.json(openapiSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec, { customSiteTitle: 'Lama Linked.In — API' }));

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

export default app;
