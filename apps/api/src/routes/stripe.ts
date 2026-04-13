import { Router, type Router as RouterType, Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../db/client.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const stripe = STRIPE_KEY && STRIPE_KEY.startsWith('sk_')
  ? new Stripe(STRIPE_KEY, { apiVersion: '2024-11-20.acacia' as any })
  : null;

// Price IDs per plan
const PRICE_IDS: Record<string, string | undefined> = {
  weekly: process.env.STRIPE_PRICE_WEEKLY_ID,
  monthly: process.env.STRIPE_PRICE_MONTHLY_ID,
  yearly: process.env.STRIPE_PRICE_YEARLY_ID,
};

export const stripeRouter: RouterType = Router();

// Guard: if Stripe is not configured, return 503 on all payment routes
function requireStripe(_req: Request, res: Response, next: Function) {
  if (!stripe) {
    res.status(503).json({ message: 'Stripe non configuré' });
    return;
  }
  next();
}

// Helper: extract userId from Bearer token if present (optional auth)
function extractUserId(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

stripeRouter.post('/create-checkout', requireStripe, async (req: Request, res: Response): Promise<void> => {
  try {
    const { installId, plan } = req.body;
    const userId = extractUserId(req);

    // Find user by JWT token or installId
    let user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : installId
        ? await prisma.user.findFirst({ where: { installId } })
        : null;

    if (!user && !installId) {
      res.status(400).json({ message: 'Authentification ou installId requis' });
      return;
    }

    let customerId = user?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe!.customers.create({
        email: user?.email,
        metadata: { installId: installId || '', userId: user?.id || '' },
      });
      customerId = customer.id;
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
      }
    }

    // Select price based on plan (weekly, monthly, yearly)
    const selectedPlan = plan || 'monthly';
    const priceId = PRICE_IDS[selectedPlan] || process.env.STRIPE_PRICE_MONTHLY_ID;

    if (!priceId) {
      res.status(400).json({ message: `Plan "${selectedPlan}" non configuré` });
      return;
    }

    const session = await stripe!.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL || 'https://lamalinked.in'}/dashboard?checkout=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'https://lamalinked.in'}/pricing`,
      metadata: { installId: installId || '', userId: user?.id || '', plan: selectedPlan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ message: 'Erreur création session Stripe' });
  }
});

stripeRouter.post('/portal', requireStripe, async (req: Request, res: Response): Promise<void> => {
  try {
    const { installId } = req.body;
    const userId = extractUserId(req);

    // Find user by JWT or installId
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : installId
        ? await prisma.user.findFirst({ where: { installId } })
        : null;

    if (!user?.stripeCustomerId) {
      res.status(404).json({ message: 'Client Stripe non trouvé' });
      return;
    }

    const portalSession = await stripe!.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'https://lamalinked.in'}/account`,
    });

    res.json({ url: portalSession.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ message: 'Erreur portail Stripe' });
  }
});

stripeRouter.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const installId = req.query.installId as string;
    if (!installId) {
      res.status(400).json({ message: 'installId requis' });
      return;
    }

    const user = await prisma.user.findFirst({ where: { installId } });
    if (!user) {
      res.json({ premium: false, expires: null });
      return;
    }

    const isPremium = user.tier === 'premium' && (!user.premiumExpires || user.premiumExpires > new Date());
    res.json({
      premium: isPremium,
      expires: user.premiumExpires?.toISOString() || null,
    });
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ message: 'Erreur statut' });
  }
});

// Stripe webhook
stripeRouter.post('/webhook', requireStripe, async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe!.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (err) {
    console.error('Webhook signature failed:', err);
    res.status(400).send('Webhook Error');
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const installId = session.metadata?.installId;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan || 'monthly';
      const expires = new Date();
      if (plan === 'weekly') expires.setDate(expires.getDate() + 7);
      else if (plan === 'yearly') expires.setFullYear(expires.getFullYear() + 1);
      else expires.setMonth(expires.getMonth() + 1);
      const updateData = { tier: plan, premiumExpires: expires, stripeCustomerId: session.customer as string };

      if (userId) {
        await prisma.user.update({ where: { id: userId }, data: updateData }).catch(() => {});
      } else if (installId) {
        await prisma.user.updateMany({ where: { installId }, data: updateData });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { tier: 'free', premiumExpires: null },
      });
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const expires = new Date();
      expires.setMonth(expires.getMonth() + 1);
      await prisma.user.updateMany({
        where: { stripeCustomerId: customerId },
        data: { tier: 'premium', premiumExpires: expires },
      });
      break;
    }
  }

  res.json({ received: true });
});
