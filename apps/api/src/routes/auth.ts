import { Router, type Router as RouterType, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { authMiddleware, signToken, AuthRequest } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/email.js';

/** Hash SHA-256 d'un token (on ne stocke jamais le token brut en base). */
function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export const authRouter: RouterType = Router();

// Hash bcrypt fixe : égalise le temps de réponse du login quand l'email n'existe pas (anti-énumération).
const DUMMY_HASH = bcrypt.hashSync('no-user-placeholder', 12);

const loginLimiter = rateLimiter({
  maxRequests: 5,
  windowSeconds: 60,
  prefix: 'rl:login',
  message: 'Trop de tentatives de connexion. Réessayez dans 1 minute.',
});

const registerLimiter = rateLimiter({
  maxRequests: 3,
  windowSeconds: 300,
  prefix: 'rl:register',
  message: 'Trop de créations de compte. Réessayez dans 5 minutes.',
});

const forgotLimiter = rateLimiter({
  maxRequests: 3,
  windowSeconds: 300,
  prefix: 'rl:forgot',
  message: 'Trop de demandes. Réessayez dans quelques minutes.',
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

authRouter.post('/register', registerLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: 'Email déjà utilisé' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashed, name },
    });

    const token = signToken(user.id);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(email, name).catch(() => {});

    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: 'Données invalides', errors: err.errors });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

authRouter.post('/login', loginLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
    if (!user || !valid) {
      res.status(401).json({ message: 'Identifiants incorrects' });
      return;
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: 'Données invalides' });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

authRouter.put('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = updateProfileSchema.parse(req.body);

    // If changing email, check uniqueness
    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing && existing.id !== req.userId) {
        res.status(409).json({ message: 'Email déjà utilisé' });
        return;
      }
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
      select: { id: true, email: true, name: true, createdAt: true },
    });

    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: 'Données invalides', errors: err.errors });
      return;
    }
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

authRouter.put('/password', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashed },
    });

    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: 'Données invalides', errors: err.errors });
      return;
    }
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Suppression de compte (RGPD) : la cascade Prisma efface events et sessions liés.
authRouter.delete('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: req.userId } });
    res.json({ message: 'Compte et données supprimés.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Réponse toujours générique : anti-énumération de comptes (OWASP).
authRouter.post('/forgot-password', forgotLimiter, async (req: Request, res: Response): Promise<void> => {
  const genericMessage = 'Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé.';
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: hashToken(rawToken), resetTokenExpiry: expiry },
      });

      // Envoi non-bloquant : la réponse ne doit jamais dépendre de l'email.
      sendPasswordResetEmail(email, rawToken).catch((e) => console.error('Reset email error:', e));
    }

    res.json({ message: genericMessage });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: 'Données invalides', errors: err.errors });
      return;
    }
    console.error('Forgot password error:', err);
    // Même en cas d'erreur interne, on reste générique.
    res.json({ message: genericMessage });
  }
});

authRouter.post('/reset-password', forgotLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashToken(token),
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      res.status(400).json({ message: 'Lien invalide ou expiré. Refaites une demande.' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: 'Données invalides', errors: err.errors });
      return;
    }
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
