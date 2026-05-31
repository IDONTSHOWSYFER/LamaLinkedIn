import { Request, Response, NextFunction } from 'express';

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
}

export function cacheControl(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET') {
    if (req.path === '/api/health') {
      res.setHeader('Cache-Control', 'public, max-age=300');
    } else if (req.path.includes('/stats')) {
      res.setHeader('Cache-Control', 'private, max-age=30');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }

  next();
}

export function performanceLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`[Perf] ${req.method} ${req.path} — ${duration}ms (SLOW)`);
    }
  });

  next();
}
