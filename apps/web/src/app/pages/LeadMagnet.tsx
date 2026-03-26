import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Mail, Check, ShieldCheck, Download, Zap, Star, TrendingUp, Clock, BookOpen } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { api } from '../lib/api';

export function LeadMagnet() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError('Veuillez entrer votre prenom.');
      return;
    }
    if (!email.includes('@')) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }
    if (!consent) {
      setError("Veuillez accepter de recevoir l'e-book.");
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await api('/lead', {
        method: 'POST',
        body: JSON.stringify({ firstName, email }),
      });
    } catch {
      // Continue even if API fails (fallback for demo)
    }

    setIsLoading(false);
    navigate('/thank-you');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 py-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-6xl z-10"
      >
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 mb-6 text-primary">
            <BookOpen size={40} />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-adaptive mb-6 leading-tight">
            Transformez vos commentaires Linked.In en <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">opportunites</span>
          </h1>
          <p className="text-xl text-neutral-300 mb-8 max-w-3xl mx-auto">
            Telechargez gratuitement notre e-book : <span className="text-adaptive font-bold">30 scripts de commentaires</span> qui generent de vraies conversations et remplissent votre pipeline.
          </p>

          {/* Social Proof */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <div className="flex text-warning">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
              </div>
              <span className="text-neutral-400 text-sm">4.9/5 (2,400+ telechargements)</span>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-neutral-400 text-sm">
              <Download size={16} className="text-success" />
              <span>+8,500 commerciaux l'ont telecharge</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Benefits */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-adaptive mb-6">Ce que contient l'e-book :</h2>
              <div className="space-y-4">
                {[
                  { title: "30 scripts prets a l'emploi", desc: "Copiez-collez et adaptez selon votre cible et votre industrie." },
                  { title: 'La methode CAR', desc: "Commentaire - Apport de valeur - Relance. La structure qui fonctionne." },
                  { title: '5 accroches a fort impact', desc: "Les phrases qui generent 80% de reponses et d'engagements." },
                  { title: 'Comment rebondir sur un post viral', desc: "Transformez la viralite des autres en opportunites pour vous." },
                  { title: 'Templates par persona', desc: "Directeurs Marketing, SDR, Founders... Adaptez selon votre cible." },
                  { title: 'Checklist anti-spam', desc: "Evitez les erreurs qui tuent votre credibilite et votre portee." }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <Check className="text-success shrink-0 mt-0.5" size={24} />
                    <div>
                      <h4 className="text-adaptive font-semibold mb-1">{item.title}</h4>
                      <p className="text-neutral-400 text-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <GlassCard className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
              <h3 className="text-adaptive font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="text-primary" size={20} />
                Resultats moyens apres application
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-adaptive">+40%</div>
                  <div className="text-xs text-neutral-400">Taux de reponse</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-adaptive">3x</div>
                  <div className="text-xs text-neutral-400">Plus d'inbound</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-adaptive">15min</div>
                  <div className="text-xs text-neutral-400">Par jour</div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right: Form */}
          <div className="sticky top-8">
            <GlassCard className="p-8 md:p-10 border-white/20 relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

              <div className="mb-6">
                <div className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold mb-3">
                  100% GRATUIT
                </div>
                <h2 className="text-2xl font-bold text-adaptive mb-2">Recevez votre copie instantanement</h2>
                <p className="text-neutral-400 text-sm">Remplissez le formulaire ci-dessous. Livraison immediate par email.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-neutral-300 mb-2">
                    Prenom
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="block w-full px-4 py-3 border border-white/10 rounded-lg bg-neutral-900/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="Jean"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                    Adresse email professionnelle
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-neutral-500" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      className={`block w-full pl-10 pr-3 py-3 border ${error ? 'border-danger/50 focus:ring-danger/50' : 'border-white/10 focus:ring-primary focus:border-primary'} rounded-lg bg-neutral-900/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 transition-all`}
                      placeholder="jean.dupont@entreprise.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {error && <p className="mt-2 text-sm text-danger">{error}</p>}
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center h-5">
                    <input
                      id="consent"
                      type="checkbox"
                      className="w-4 h-4 rounded border-white/20 bg-neutral-900/50 text-primary focus:ring-primary focus:ring-offset-neutral-900"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                  </div>
                  <label htmlFor="consent" className="text-sm text-neutral-400 leading-tight">
                    J'accepte de recevoir l'e-book et quelques conseils occasionnels pour prospecter sur Linked.In (desinscription en 1 clic).
                  </label>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg shadow-[0_0_30px_rgba(139,92,246,0.4)]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Zap className="mr-2 animate-spin" size={20} /> Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2" size={20} /> Telecharger l'e-book gratuitement
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 pt-2">
                  <ShieldCheck size={14} className="text-success" /> Vos donnees sont 100% securisees. Pas de spam.
                </div>
              </form>

              {/* Trust Elements */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="text-xs text-neutral-500 text-center mb-4">Deja telecharge par :</p>
                <div className="flex justify-center gap-6 opacity-60">
                  <span className="text-sm font-bold text-adaptive-muted">TechFlow</span>
                  <span className="text-sm font-bold text-adaptive-muted">Acme</span>
                  <span className="text-sm font-bold text-adaptive-muted">Stratos</span>
                </div>
              </div>
            </GlassCard>

            {/* Timer / Urgency */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-center"
            >
              <GlassCard className="p-4 bg-accent/10 border-accent/30 inline-block">
                <p className="text-sm text-accent flex items-center gap-2">
                  <Clock size={16} /> <span className="font-medium">Bonus : Les 100 premiers recoivent un template exclusif</span>
                </p>
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
