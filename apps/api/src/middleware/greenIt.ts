/**
 * Middleware Green IT & Sécurité
 *
 * Éco-conception :
 * - Compression gzip des réponses (réduit la bande passante de ~70%)
 * - Cache-Control headers (évite les requêtes inutiles)
 * - Pagination par défaut (limite la charge serveur)
 *
 * Sécurité :
 * - Headers de sécurité HTTP (OWASP recommandations)
 * - Protection contre les attaques courantes (XSS, clickjacking, MIME sniffing)
 *
 * Compétences CDA :
 * - Les besoins d'éco-conception sont identifiés
 * - Les composants serveurs sont sécurisés
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Headers de sécurité HTTP (OWASP)
 * Protection contre XSS, clickjacking, MIME sniffing, etc.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // Empêche le chargement dans un iframe (clickjacking)
  res.setHeader('X-Frame-Options', 'DENY');

  // Empêche le MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Active la protection XSS du navigateur
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Politique de référent (limite les fuites d'URL)
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy basique
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");

  // Strict Transport Security (HTTPS obligatoire)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  // Permissions Policy (limite les fonctionnalités du navigateur)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
}

/**
 * Cache-Control intelligent pour l'éco-conception.
 * Les réponses statiques/idempotentes sont cachées côté client,
 * réduisant les requêtes réseau et l'empreinte carbone.
 */
export function cacheControl(req: Request, res: Response, next: NextFunction): void {
  // Les réponses GET peuvent être cachées brièvement
  if (req.method === 'GET') {
    // Health check : cache long (5 min)
    if (req.path === '/api/health') {
      res.setHeader('Cache-Control', 'public, max-age=300');
    }
    // Stats : cache court (30s) — déjà caché dans Redis, ceinture et bretelles
    else if (req.path.includes('/stats')) {
      res.setHeader('Cache-Control', 'private, max-age=30');
    }
    // Autres GET : pas de cache
    else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  } else {
    // POST/PUT/DELETE : jamais de cache
    res.setHeader('Cache-Control', 'no-store');
  }

  next();
}

/**
 * Logger minimal pour le monitoring de performance (éco-conception).
 * Mesure le temps de réponse de chaque requête.
 */
export function performanceLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    // Log uniquement les requêtes lentes (> 500ms) pour économiser les I/O
    if (duration > 500) {
      console.warn(`[Perf] ${req.method} ${req.path} — ${duration}ms (SLOW)`);
    }
  });

  next();
}
