import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Download, CheckCircle, ArrowRight, Zap, Star, Sparkles, Clock, TrendingUp, Mail, Chrome } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';

export function ThankYou() {
  return (
    <div className="flex-1 flex flex-col py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto w-full space-y-12"
      >
        {/* Success Message */}
        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-success/20 to-success/5 text-success mb-4 border-4 border-success/20"
          >
            <CheckCircle size={48} />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-adaptive">Merci ! Verifiez votre boite mail</h1>
          <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
            L'e-book <span className="text-adaptive font-bold">"30 scripts de commentaires Linked.In"</span> vient de vous etre envoye. Vous pouvez egalement le telecharger directement ci-dessous.
          </p>

          {/* Email reminder */}
          <GlassCard className="p-4 bg-primary/10 border-primary/30 max-w-lg mx-auto">
            <div className="flex items-center gap-3">
              <Mail className="text-primary shrink-0" size={20} />
              <p className="text-sm text-neutral-300 text-left">
                <span className="font-medium text-adaptive">Pensez a verifier vos spams !</span> L'email contenant votre e-book peut parfois arriver dans les courriers indesirables.
              </p>
            </div>
          </GlassCard>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <a href="/ebook/playbook_linkedin.pdf" download>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-success text-success hover:bg-success/10 hover:text-white text-lg px-8"
              >
                <Download className="mr-2" size={20} /> Telecharger l'e-book maintenant
              </Button>
            </a>
          </div>
        </div>

        {/* Quick Wins Section */}
        <GlassCard className="p-8 bg-white/5 border-white/10">
          <h2 className="text-2xl font-bold text-adaptive mb-6 text-center">3 actions immediates pour commencer</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Lisez la page 4', desc: 'Decouvrez la methode CAR (15 min)', icon: <span className="text-4xl">&#x1f4d6;</span> },
              { step: '2', title: 'Testez le script #7', desc: 'Le plus efficace pour les debutants', icon: <span className="text-4xl">&#x270d;&#xfe0f;</span> },
              { step: '3', title: 'Commentez 3 posts', desc: "Appliquez des aujourd'hui", icon: <span className="text-4xl">&#x1f680;</span> }
            ].map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.15 }}
                className="text-center p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-all border border-white/5"
              >
                <div className="mb-3">{action.icon}</div>
                <div className="text-xs font-bold text-primary mb-2">ETAPE {action.step}</div>
                <h3 className="text-lg font-bold text-adaptive mb-2">{action.title}</h3>
                <p className="text-sm text-neutral-400">{action.desc}</p>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Install Extension Section - 100% Free */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 blur-3xl rounded-3xl" />
          <GlassCard className="relative p-10 md:p-12 border-2 border-accent/30 overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Chrome size={160} />
            </div>

            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-bold mb-6 border border-accent/30">
                <Sparkles size={16} /> 100% GRATUIT
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-adaptive mb-4">
                Passez a la vitesse superieure avec <span className="text-accent">l'extension Lama</span>
              </h2>
              <p className="text-xl text-neutral-300 mb-8 max-w-2xl">
                Les scripts c'est bien, mais envoyer les bons messages aux bonnes personnes au bon moment directement depuis LinkedIn, c'est encore mieux. <span className="text-adaptive font-semibold">Et c'est entierement gratuit.</span>
              </p>

              {/* Benefits Grid */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {[
                  { icon: <Star className="text-warning" size={24} />, title: 'Bibliotheque de templates', desc: "Des dizaines de scripts prets a l'emploi" },
                  { icon: <Zap className="text-accent" size={24} />, title: 'Mode Agent semi-automatise', desc: 'Visites de profils et suivis assistes' },
                  { icon: <TrendingUp className="text-success" size={24} />, title: 'Statistiques en temps reel', desc: 'Suivez votre activite et vos resultats' },
                  { icon: <Clock className="text-primary" size={24} />, title: 'Gagnez du temps chaque jour', desc: 'Laissez Lama vous assister au quotidien' }
                ].map((benefit, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                    <div className="shrink-0 mt-1">{benefit.icon}</div>
                    <div>
                      <h4 className="text-adaptive font-bold mb-1">{benefit.title}</h4>
                      <p className="text-neutral-400 text-sm">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://chromewebstore.google.com/detail/mjabdegoelohpjfgcljlphoeffiafdpi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button size="lg" className="w-full text-lg shadow-[0_0_30px_rgba(168,85,247,0.4)] bg-accent hover:bg-accent/90 text-neutral-900 font-bold">
                    <Chrome className="mr-2" size={20} /> Installer l'extension gratuite
                  </Button>
                </a>
                <Link to="/dashboard" className="flex-1">
                  <Button variant="outline" size="lg" className="w-full text-lg border-2 border-white/20">
                    Voir mon tableau de bord <ArrowRight className="ml-2" size={20} />
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <GlassCard className="p-8 bg-white/5">
            <h3 className="text-center text-xl font-bold text-adaptive mb-6">Ce qu'ils disent de Lama</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { name: 'Thomas L.', role: 'SDR', text: "J'ai genere 23 RDV qualifies en 3 semaines. Et l'outil est 100% gratuit, c'est dingue !", rating: 5 },
                { name: 'Claire M.', role: 'Freelance', text: "L'automatisation me fait gagner 2h par jour. Je peux enfin me concentrer sur mes clients.", rating: 5 }
              ].map((testimonial, i) => (
                <div key={i} className="p-5 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex text-warning mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                  </div>
                  <p className="text-neutral-300 text-sm mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-adaptive font-medium text-sm">{testimonial.name}</div>
                      <div className="text-neutral-500 text-xs">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Next Steps */}
        <div className="text-center text-neutral-400 text-sm">
          <p>Des questions ? Repondez simplement a l'email de bienvenue que vous venez de recevoir.</p>
        </div>
      </motion.div>
    </div>
  );
}
