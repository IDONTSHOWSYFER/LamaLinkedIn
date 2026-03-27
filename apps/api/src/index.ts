import 'dotenv/config';
import express, { type Express, Request, Response } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { eventsRouter } from './routes/events.js';
import { stripeRouter } from './routes/stripe.js';
import { leadRouter } from './routes/lead.js';
import { securityHeaders, cacheControl, performanceLogger } from './middleware/greenIt.js';
import { rateLimiter } from './middleware/rateLimiter.js';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ─── Sécurité & Green IT ───────────────────────────────────────────────────
app.use(securityHeaders);       // Headers OWASP (sécurité)
app.use(cacheControl);          // Cache-Control intelligent (éco-conception)
app.use(performanceLogger);     // Monitoring des requêtes lentes (éco-conception)

// Rate limiter global : 200 req/min par IP (protection DDoS, NoSQL/Redis)
app.use(rateLimiter({ maxRequests: 200, windowSeconds: 60, prefix: 'rl:global' }));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin.startsWith('chrome-extension://') ||
        origin.startsWith('http://localhost') ||
        origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
}));

// Stripe webhook needs raw body
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Limite la taille du body JSON (éco-conception : évite les payloads abusifs)
app.use(express.json({ limit: '100kb' }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', version: '1.0.0', greenIt: true });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/lead', leadRouter);

app.listen(PORT, () => {
  console.log(`Lama Linked.In API running on port ${PORT}`);
});

export default app;
