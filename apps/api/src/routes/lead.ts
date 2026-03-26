import { Router, type Router as RouterType, Request, Response } from 'express';
import { z } from 'zod';
import { sendEbookEmail } from '../services/email.js';

export const leadRouter: RouterType = Router();

const leadSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  consent: z.boolean().optional(),
});

leadRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, firstName } = leadSchema.parse(req.body);

    // Send ebook email (non-blocking)
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
