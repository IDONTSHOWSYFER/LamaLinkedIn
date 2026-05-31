import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../db/redis.js';

interface RateLimitOptions {
  maxRequests: number;
  windowSeconds: number;
  prefix?: string;
  message?: string;
}

export function rateLimiter(options: RateLimitOptions) {
  const {
    maxRequests,
    windowSeconds,
    prefix = 'rl',
    message = 'Trop de requêtes. Réessayez dans quelques instants.',
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Les préflights CORS ne doivent jamais être limités.
    if (req.method === 'OPTIONS') { next(); return; }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${prefix}:${ip}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;

    try {
      const client = getRedis();
      const count = await client.incr(key);

      if (count === 1) {
        await client.expire(key, windowSeconds);
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + windowSeconds);

      if (count > maxRequests) {
        res.status(429).json({ message, retryAfter: windowSeconds });
        return;
      }

      next();
    } catch (err) {
      // Fail-open : un incident Redis ne doit jamais bloquer les requêtes.
      console.warn('[RateLimiter] Redis error, failing open:', err);
      next();
    }
  };
}
