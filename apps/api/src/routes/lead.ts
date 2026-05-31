import { Router, type Router as RouterType, Request, Response } from 'express';
import { z } from 'zod';
import { sendEbookEmail } from '../services/email.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

export const leadRouter: RouterType = Router();

const leadLimiter = rateLimiter({
  maxRequests: 5,
  windowSeconds: 3600,
  prefix: 'rl:lead',
  message: "Trop de demandes d'ebook. Réessayez dans une heure.",
});

const leadSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(80),
  consent: z.boolean().optional(),
});

leadRouter.post('/', leadLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, firstName } = leadSchema.parse(req.body);

    sendEbookEmail(email, firstName).catch((err) => {
      console.error('Ebook email error:', err);
    });

    res.status(200).json({ message: 'Email envoyé avec succès' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ message: 'Données invalides', errors: err.errors });
      return;
    }
    console.error('Lead error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});
