import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router';
import { Lock, ShieldCheck, CheckCircle, CreditCard, Star, Zap, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

const PLANS: Record<string, { name: string; price: string; originalPrice?: string; features: string[] }> = {
  premium: {
    name: 'Lama Premium',
    price: '9EUR',
    originalPrice: '11EUR',
    features: [
      'Extension Chrome complete',
      '100 requetes par jour',
      'Templates illimites',
      'Filtres avances',
      'Analytics temps reel',
      'Support prioritaire',
    ],
  },
  pro: {
    name: 'Lama Pro',
    price: '19EUR',
    features: [
      'Extension Chrome complete',
      'Requetes illimitees',
      'Templates illimites & Partage',
      'Filtres avances & IA',
      'Export CSV & Webhooks',
      'Support prioritaire 24/7',
    ],
  },
};

export function Checkout() {
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get('plan') || 'premium';
  const plan = PLANS[planKey] || PLANS.premium;
  const { user } = useAuth();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    if (!user) {
      // Redirect to login if not authenticated
      window.location.href = `/login?redirect=/checkout?plan=${planKey}`;
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const data = await api<{ url: string }>('/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan: planKey }),
      });
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la creation de la session de paiement.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-16 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-5xl w-full z-10"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/20 text-success text-sm font-medium mb-4">
            <CheckCircle size={16} /> Derniere etape avant de transformer votre prospection
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-adaptive mb-4">Finalisez votre commande</h1>
          <p className="text-neutral-400">Rejoignez les 10,000+ commerciaux qui prospectent avec Lama</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm text-center max-w-2xl mx-auto"
          >
            {error}
          </motion.div>
        )}

        <GlassCard className="grid md:grid-cols-5 overflow-hidden border-primary/20">
          {/* Left: Order Summary */}
          <div className="md:col-span-2 bg-gradient-to-br from-neutral-900 to-neutral-900/50 p-8 border-r border-white/5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-adaptive mb-1">{plan.name}</h2>
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold">
                    <Zap size={12} /> {planKey === 'premium' ? 'Plus populaire' : 'Pour equipes'}
                  </div>
                </div>
                <div className="text-right">
                  {plan.originalPrice && (
                    <div className="text-sm text-neutral-500 line-through">{plan.originalPrice}</div>
                  )}
                  <div className="text-3xl font-extrabold text-adaptive">{plan.price}</div>
                  <div className="text-xs text-neutral-400">/ mois</div>
                </div>
              </div>

              <div className="space-y-3 mb-6 pb-6 border-b border-white/10">
                <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">Inclus dans votre plan :</h3>
                {plan.features.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-neutral-300">
                    <CheckCircle className="text-primary shrink-0 mt-0.5" size={16} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Trust Elements */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                  <Star className="text-warning shrink-0" size={20} />
                  <div className="text-xs">
                    <div className="text-adaptive font-semibold">ROI moyen: 10x en 30 jours</div>
                    <div className="text-neutral-400">Base sur 2,400+ utilisateurs</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <TrendingUp className="text-primary shrink-0" size={20} />
                  <div className="text-xs">
                    <div className="text-adaptive font-semibold">+40% de taux de reponse</div>
                    <div className="text-neutral-400">En moyenne apres 7 jours</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <ShieldCheck size={16} className="text-success" />
                Garantie satisfait ou rembourse 14 jours.
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Lock size={16} className="text-primary" />
                Paiement securise par Stripe. Vos donnees sont cryptees.
              </div>
            </div>
          </div>

          {/* Right: Payment Form */}
          <div className="md:col-span-3 p-8 md:p-12 bg-white/5 flex flex-col justify-center">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-adaptive mb-2">Informations de paiement</h3>
              <p className="text-neutral-400 text-sm">Vos donnees sont 100% securisees et cryptees</p>
            </div>

            {/* Payment Method Icons */}
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
              <div className="text-neutral-400 text-sm font-medium">Paiement accepte :</div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-adaptive text-xs font-bold">VISA</div>
                <div className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-adaptive text-xs font-bold">MC</div>
                <div className="px-3 py-1.5 rounded bg-white/10 border border-white/20 text-adaptive text-xs font-bold">AMEX</div>
              </div>
            </div>

            {/* Stripe Redirect */}
            <div className="bg-neutral-900/50 border-2 border-dashed border-white/20 rounded-xl p-12 mb-8 text-center">
              <Lock className="mx-auto mb-4 text-neutral-500" size={48} />
              <h4 className="text-adaptive font-semibold mb-3">Paiement securise via Stripe</h4>
              <p className="text-neutral-400 mb-6 text-sm max-w-md mx-auto">
                Vous serez redirige vers la page de paiement securisee Stripe pour completer votre achat par carte bancaire, Apple Pay ou Google Pay.
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 mb-6">
                <CreditCard size={14} />
                <span>Paiement crypte avec SSL 256-bit</span>
              </div>
              <Button
                size="lg"
                className="w-full bg-[#635BFF] hover:bg-[#635BFF]/90 text-white font-semibold text-lg shadow-[0_0_30px_rgba(99,91,255,0.3)]"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Zap className="mr-2 animate-spin" size={20} /> Redirection vers Stripe...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2" size={20} /> Payer {plan.price}/mois avec Stripe
                  </>
                )}
              </Button>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <p className="text-xs text-center text-neutral-500">
                En cliquant sur "Payer", vous acceptez nos{' '}
                <Link to="/legal" className="underline text-primary hover:text-primary/80">
                  Conditions generales de vente
                </Link>
                . Annulable a tout moment.
              </p>

              {/* Testimonial */}
              <GlassCard className="p-4 bg-white/5 border-success/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shrink-0">
                    M
                  </div>
                  <div>
                    <div className="flex text-warning mb-1">
                      {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                    </div>
                    <p className="text-neutral-300 text-xs italic mb-1">
                      "Meilleur investissement de l'annee pour ma prospection. ROI incroyable !"
                    </p>
                    <div className="text-neutral-500 text-xs">- Marie D., SDR chez TechFlow</div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </GlassCard>

        {/* Bottom Trust Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 grid md:grid-cols-3 gap-6 text-center"
        >
          {[
            { icon: <ShieldCheck size={24} />, text: "Paiement 100% securise" },
            { icon: <Zap size={24} />, text: "Acces immediat apres paiement" },
            { icon: <CheckCircle size={24} />, text: "Garantie 14 jours satisfait ou rembourse" }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-center gap-3 text-neutral-400 text-sm">
              <div className="text-primary">{item.icon}</div>
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
