import { Router, type Router as RouterType, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { rateLimiter, userRateLimiter } from '../middleware/rateLimiter.js';
import { cached, invalidateCache } from '../db/redis.js';

export const eventsRouter: RouterType = Router();

// Rate limiter pour la création d'events (anti-spam, NoSQL/Redis)
const eventLimiter = rateLimiter({
  maxRequests: 120,
  windowSeconds: 60,
  prefix: 'rl:events',
  message: 'Trop d\'événements envoyés. Ralentissez.',
});

const eventSchema = z.object({
  type: z.enum(['like', 'comment', 'connection', 'message']),
  postId: z.string().optional(),
  authorName: z.string().optional(),
  authorTag: z.string().optional(),
  content: z.string().optional(),
  mode: z.enum(['assist', 'agent']).optional(),
});

eventsRouter.post('/', authMiddleware, eventLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = eventSchema.parse(req.body);
    const event = await prisma.event.create({
      data: {
        userId: req.userId!,
        ...data,
      },
    });

    // Invalider le cache stats de cet utilisateur (NoSQL)
    await invalidateCache(
      `stats:${req.userId}:today`,
      `stats:${req.userId}:week`,
      `stats:${req.userId}:month`,
    );

    res.status(201).json(event);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: 'Données invalides' });
      return;
    }
    console.error('Event create error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

eventsRouter.get('/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) || 'today';
    const cacheKey = `stats:${req.userId}:${period}`;

    // Cache Redis (NoSQL) — TTL 30s pour les stats "today", 5min pour "week"/"month"
    // Éco-conception : réduit les requêtes SQL répétitives
    const cacheTTL = period === 'today' ? 30 : 300;

    const stats = await cached(cacheKey, cacheTTL, async () => {
      const now = new Date();
      let since: Date;

      switch (period) {
        case 'week':
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      const [likes, comments, total, recentEvents] = await Promise.all([
        prisma.event.count({ where: { userId: req.userId!, type: 'like', createdAt: { gte: since } } }),
        prisma.event.count({ where: { userId: req.userId!, type: 'comment', createdAt: { gte: since } } }),
        prisma.event.count({ where: { userId: req.userId!, createdAt: { gte: since } } }),
        prisma.event.findMany({
          where: { userId: req.userId!, createdAt: { gte: since } },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
      ]);

      const dailyBreakdown = await prisma.event.groupBy({
        by: ['type'],
        where: { userId: req.userId!, createdAt: { gte: since } },
        _count: true,
      });

      return { likes, comments, total, dailyBreakdown, recentEvents };
    });

    res.json(stats);
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

eventsRouter.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const events = await prisma.event.findMany({
      where: { userId: req.userId! },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    res.json(events);
  } catch (err) {
    console.error('Events list error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
