/**
 * Rate Limiter middleware basé sur Redis (NoSQL)
 *
 * Algorithme : Sliding Window Counter
 * Stocke le nombre de requêtes par IP dans Redis avec un TTL.
 *
 * Compétences CDA :
 * - Développer des composants d'accès aux données NoSQL
 * - Sécuriser les composants serveur (protection anti-abus)
 * - Éco-conception : limite la charge serveur inutile
 */

import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../db/redis.js';

interface RateLimitOptions {
  /** Nombre max de requêtes par fenêtre */
  maxRequests: number;
  /** Durée de la fenêtre en secondes */
  windowSeconds: number;
  /** Préfixe pour la clé Redis */
  prefix?: string;
  /** Message d'erreur personnalisé */
  message?: string;
}

/**
 * Crée un middleware de rate limiting.
 *
 * Exemple d'utilisation :
 * ```ts
 * router.post('/login', rateLimiter({ maxRequests: 5, windowSeconds: 60 }), handler);
 * ```
 */
export function rateLimiter(options: RateLimitOptions) {
  const {
    maxRequests,
    windowSeconds,
    prefix = 'rl',
    message = 'Trop de requêtes. Réessayez dans quelques instants.',
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${prefix}:${ip}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;

    try {
      const client = getRedis();
      const count = await client.incr(key);

      // Définir le TTL uniquement au premier incrément
      if (count === 1) {
        await client.expire(key, windowSeconds);
      }

      // Headers informatifs (bonne pratique REST)
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));
      res.setHeader('X-RateLimit-Reset', Math.ceil(Date.now() / 1000) + windowSeconds);

      if (count > maxRequests) {
        res.status(429).json({
          message,
          retryAfter: windowSeconds,
        });
        return;
      }

      next();
    } catch (err) {
      // En cas d'erreur Redis, on laisse passer (fail-open)
      console.warn('[RateLimiter] Redis error, failing open:', err);
      next();
    }
  };
}

/**
 * Rate limiter spécifique par userId (après authentification)
 * Utile pour limiter les actions métier (events, exports...)
 */
export function userRateLimiter(options: RateLimitOptions & { userIdExtractor?: (req: Request) => string }) {
  const {
    maxRequests,
    windowSeconds,
    prefix = 'url',
    message = 'Limite de requêtes atteinte pour votre compte.',
    userIdExtractor,
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = userIdExtractor
      ? userIdExtractor(req)
      : (req as any).userId || 'anonymous';

    const key = `${prefix}:${userId}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;

    try {
      const client = getRedis();
      const count = await client.incr(key);

      if (count === 1) {
        await client.expire(key, windowSeconds);
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - count));

      if (count > maxRequests) {
        res.status(429).json({ message, retryAfter: windowSeconds });
        return;
      }

      next();
    } catch {
      next(); // Fail-open
    }
  };
}
