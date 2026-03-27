import { Router, type Router as RouterType, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { authMiddleware, signToken, AuthRequest } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { sendWelcomeEmail } from '../services/email.js';

export const authRouter: RouterType = Router();

// Rate limiting : protection anti-brute-force (NoSQL/Redis)
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
      user: { id: user.id, email: user.email, name: user.name, tier: user.tier },
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
    if (!user) {
      res.status(401).json({ message: 'Identifiants incorrects' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
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
        tier: user.tier,
        premiumExpires: user.premiumExpires,
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
      select: { id: true, email: true, name: true, tier: true, premiumExpires: true, createdAt: true },
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
      select: { id: true, email: true, name: true, tier: true, premiumExpires: true, createdAt: true },
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
