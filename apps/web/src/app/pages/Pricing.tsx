import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Check, X, Shield, Zap, HelpCircle, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';

export function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '0EUR',
      period: '/mois',
      description: "Pour decouvrir les bases de l'automatisation Linked.In.",
      features: [
        { name: 'Extension Chrome basique', included: true },
        { name: '10 requetes par jour', included: true },
        { name: '3 templates de base', included: true },
        { name: 'Filtres avances', included: false },
        { name: 'Export CSV', included: false },
        { name: 'Support prioritaire', included: false }
      ],
      cta: 'Commencer',
      href: '/register',
      recommended: false,
      badge: null
    },
    {
      name: 'Premium',
      price: '9EUR',
      period: '/mois',
      originalPrice: '11EUR',
      description: "L'outil essentiel pour les solopreneurs et freelances.",
      features: [
        { name: 'Extension Chrome complete', included: true },
        { name: '100 requetes par jour', included: true },
        { name: 'Templates illimites', included: true },
        { name: 'Filtres avances', included: true },
        { name: 'Export CSV', included: false },
        { name: 'Support standard', included: true }
      ],
      cta: 'Commencer Premium',
      href: '/checkout?plan=premium',
      recommended: true,
      badge: 'Plus populaire',
      highlight: 'ROI moyen : 10x en 30 jours'
    },
    {
      name: 'Pro',
      price: '19EUR',
      period: '/mois',
      description: 'Pour les equipes sales et la prospection intensive.',
      features: [
        { name: 'Extension Chrome complete', included: true },
        { name: 'Requetes illimitees (limites Linked.In)', included: true },
        { name: 'Templates illimites & Partage', included: true },
        { name: 'Filtres avances & IA', included: true },
        { name: 'Export CSV & Webhooks', included: true },
        { name: 'Support prioritaire 24/7', included: true }
      ],
      cta: 'Devenir Pro',
      href: '/checkout?plan=pro',
      recommended: false,
      badge: 'Pour equipes'
    }
  ];

  return (
    <div className="py-16 px-4">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
              Tarifs simples et transparents
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-adaptive mb-6">Investissez dans votre prospection</h1>
            <p className="text-xl text-neutral-400 max-w-2xl mx-auto mb-8">
              Des forfaits simples et transparents. Annulez a tout moment en un clic.
            </p>

            {/* Social Proof Banner */}
            <div className="flex flex-wrap justify-center gap-8 items-center mt-8 text-sm text-neutral-400">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-success" size={16} />
                <span>+10,000 utilisateurs actifs</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <Shield className="text-primary" size={16} />
                <span>Paiement 100% securise</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <Check className="text-success" size={16} />
                <span>Garantie 14 jours</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative"
            >
              {plan.badge && (
                <div className="absolute -top-4 inset-x-0 flex justify-center z-10">
                  <span className="bg-accent text-neutral-900 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-accent/20">
                    {plan.badge}
                  </span>
                </div>
              )}

              <GlassCard className={`h-full p-8 flex flex-col ${plan.recommended ? 'border-2 border-primary shadow-[0_0_40px_rgba(139,92,246,0.2)] bg-primary/5 scale-105 relative' : 'border-white/10'}`}>
                {plan.recommended && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/5 rounded-xl pointer-events-none" />
                )}

                <div className="relative z-10">
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-adaptive mb-2">{plan.name}</h3>
                    <p className="text-neutral-400 text-sm min-h-[2.5rem]">{plan.description}</p>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2 mb-1">
                      {plan.originalPrice && (
                        <span className="text-xl text-neutral-500 line-through">{plan.originalPrice}</span>
                      )}
                      <span className="text-5xl font-extrabold text-adaptive">{plan.price}</span>
                      <span className="text-neutral-400">{plan.period}</span>
                    </div>
                    {plan.highlight && (
                      <p className="text-xs text-success font-medium mt-2">{plan.highlight}</p>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-3">
                        {feat.included ? (
                          <Check className="text-primary shrink-0" size={20} />
                        ) : (
                          <X className="text-neutral-600 shrink-0" size={20} />
                        )}
                        <span className={feat.included ? 'text-neutral-200' : 'text-neutral-500'}>
                          {feat.name}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link to={plan.href} className="w-full">
                    <Button
                      variant={plan.recommended ? 'primary' : 'outline'}
                      size="lg"
                      className={`w-full ${plan.recommended ? 'shadow-[0_0_20px_rgba(139,92,246,0.3)]' : ''}`}
                    >
                      {plan.cta} <ArrowRight size={18} className="ml-2" />
                    </Button>
                  </Link>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold text-adaptive mb-8 text-center">Comparaison detaillee</h2>
          <GlassCard className="overflow-hidden border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-neutral-300 font-semibold">Fonctionnalite</th>
                    <th className="px-6 py-4 text-center text-neutral-300 font-semibold">Free</th>
                    <th className="px-6 py-4 text-center text-primary font-semibold">Premium</th>
                    <th className="px-6 py-4 text-center text-neutral-300 font-semibold">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    { feature: 'Requetes quotidiennes', free: '10', premium: '100', pro: 'Illimite*' },
                    { feature: 'Templates de messages', free: '3', premium: 'Illimite', pro: 'Illimite' },
                    { feature: 'Filtres avances', free: '--', premium: 'Oui', pro: 'Oui + IA' },
                    { feature: 'Export de donnees', free: '--', premium: '--', pro: 'CSV + API' },
                    { feature: 'Analytics', free: 'Basique', premium: 'Avance', pro: 'Premium + BI' },
                    { feature: 'Support', free: 'Email', premium: 'Priority', pro: '24/7 Phone' }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-adaptive font-medium">{row.feature}</td>
                      <td className="px-6 py-4 text-center text-neutral-400">{row.free}</td>
                      <td className="px-6 py-4 text-center text-adaptive font-semibold">{row.premium}</td>
                      <td className="px-6 py-4 text-center text-neutral-400">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 bg-white/5 border-t border-white/10">
              <p className="text-xs text-neutral-500">* Dans les limites imposees par Linked.In pour proteger votre compte</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Trust Badges */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
          {[
            { icon: <Shield size={32} />, title: 'Paiement 100% securise', desc: 'Vos transactions sont cryptees via Stripe. Nous ne stockons aucune donnee bancaire.' },
            { icon: <Zap size={32} />, title: 'Garantie 14 jours', desc: "Pas satisfait ? Nous vous remboursons integralement, sans question." },
            { icon: <Sparkles size={32} />, title: 'Sans engagement', desc: "Annulez ou modifiez votre plan a tout moment en 1 clic depuis votre dashboard." }
          ].map((trust, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-6 text-center h-full hover:border-primary/30 transition-all">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 text-primary mb-4">
                  {trust.icon}
                </div>
                <h3 className="text-lg font-bold text-adaptive mb-2">{trust.title}</h3>
                <p className="text-sm text-neutral-400">{trust.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl font-bold text-adaptive mb-8 text-center">Questions frequentes</h2>
          <div className="space-y-4">
            {[
              { q: 'Puis-je changer de plan plus tard ?', a: 'Oui ! Vous pouvez upgrader ou downgrader a tout moment. Les changements sont effectifs immediatement.' },
              { q: 'Comment fonctionne la garantie satisfait ou rembourse ?', a: "Si vous n'etes pas satisfait dans les 14 premiers jours, envoyez-nous un email et nous vous remboursons integralement." },
              { q: 'Acceptez-vous les cartes bancaires internationales ?', a: 'Oui, nous acceptons Visa, Mastercard, American Express de tous les pays via Stripe.' }
            ].map((faq, i) => (
              <GlassCard key={i} className="p-6 hover:bg-white/10 transition-all">
                <h4 className="text-adaptive font-semibold mb-2 flex items-start gap-3">
                  <HelpCircle size={20} className="text-primary shrink-0 mt-0.5" /> {faq.q}
                </h4>
                <p className="text-neutral-400 text-sm pl-8">{faq.a}</p>
              </GlassCard>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <GlassCard className="p-12 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">Encore des questions ?</h3>
            <p className="text-neutral-300 mb-6">Notre equipe est la pour vous aider a choisir le meilleur plan.</p>
            <Button variant="outline" size="lg" className="border-2 border-white/20">
              Contacter le support <ArrowRight className="ml-2" />
            </Button>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
