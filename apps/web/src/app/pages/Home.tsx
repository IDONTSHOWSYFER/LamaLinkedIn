import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ChevronRight, Chrome, Zap, BarChart, CheckCircle2, Shield, Star, TrendingUp, Clock, Target, Award, Users2, PlayCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Home() {
  return (
    <div className="flex flex-col gap-24 py-16">
      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-8"
        >
          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-accent animate-pulse shadow-lg shadow-accent/10">
            <Zap size={16} /> <span>Nouveau: Extension Chrome v2.0 - Limite a 500 utilisateurs</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-adaptive max-w-5xl leading-tight">
            Generez des <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">leads qualifies</span> sur Linked.In sans effort
          </h1>

          <p className="text-xl md:text-2xl text-neutral-300 max-w-3xl leading-relaxed">
            Automatisez vos interactions avec intelligence, construisez votre audience et remplissez votre pipeline de ventes en <span className="text-adaptive font-bold">15 minutes par jour</span>.
          </p>

          {/* Social Proof Numbers */}
          <div className="flex flex-wrap justify-center gap-8 mt-4 mb-2">
            <div className="text-center">
              <div className="text-3xl font-bold text-adaptive">+10,000</div>
              <div className="text-sm text-neutral-400">Utilisateurs actifs</div>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-bold text-adaptive">4.8/5</div>
              <div className="text-sm text-neutral-400 flex items-center gap-1">
                <Star size={14} fill="currentColor" className="text-warning" /> Note moyenne
              </div>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-bold text-adaptive">+2M</div>
              <div className="text-sm text-neutral-400">Connexions generees</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <Link to="/lead-magnet">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:shadow-[0_0_40px_rgba(139,92,246,0.6)] transition-all">
                Telecharger l'e-book gratuit
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="glass" size="lg" className="w-full sm:w-auto text-lg px-8 border-2 border-white/20 hover:border-white/40">
                Voir Premium <ChevronRight size={20} className="ml-2" />
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="pt-8 flex flex-col items-center gap-6 border-t border-white/10 w-full max-w-2xl mt-8">
            <p className="text-sm font-medium text-neutral-400">Ils utilisent Lama au quotidien :</p>
            <div className="flex flex-wrap justify-center gap-8 items-center">
              <span className="font-bold text-2xl text-adaptive-muted hover:text-adaptive transition-colors">Acme Corp</span>
              <span className="font-bold text-2xl tracking-tighter text-adaptive-muted hover:text-adaptive transition-colors">GlobalTech</span>
              <span className="font-bold text-2xl font-serif text-adaptive-muted hover:text-adaptive transition-colors">Innovate</span>
              <span className="font-bold text-2xl text-adaptive-muted hover:text-adaptive transition-colors">Stratos</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Banner */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 py-16 border-y border-white/10">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { icon: <TrendingUp size={32} />, number: "40%", label: "Taux de reponse moyen" },
              { icon: <Clock size={32} />, number: "75%", label: "Gain de temps" },
              { icon: <Target size={32} />, number: "3x", label: "Plus de leads qualifies" },
              { icon: <Award size={32} />, number: "98%", label: "Satisfaction client" }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-3"
              >
                <div className="text-primary">{stat.icon}</div>
                <div className="text-4xl font-extrabold text-adaptive">{stat.number}</div>
                <div className="text-neutral-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium mb-4">
            Simple et efficace
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-adaptive mb-6">Comment ca marche ?</h2>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">Une methode simple en 3 etapes pour transformer vos vues en rendez-vous qualifies.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Chrome className="text-primary mb-4" size={48} />,
              step: "Etape 1",
              title: "L'extension",
              desc: "Installez l'extension Chrome Lama sur votre navigateur en 1 clic. Compatible avec tous les plans Linked.In."
            },
            {
              icon: <Zap className="text-accent mb-4" size={48} />,
              step: "Etape 2",
              title: "La session",
              desc: "Activez vos routines de prospection intelligentes et ciblees. L'IA personnalise chaque interaction."
            },
            {
              icon: <BarChart className="text-success mb-4" size={48} />,
              step: "Etape 3",
              title: "Le suivi",
              desc: "Analysez vos conversions depuis votre tableau de bord centralise. Optimisez en temps reel."
            }
          ].map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-10 relative overflow-hidden group h-full hover:border-primary/50 transition-all duration-300">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-500" />
                <div className="relative z-10">
                  <div className="text-xs font-bold text-neutral-500 mb-3">{step.step}</div>
                  {step.icon}
                  <h3 className="text-2xl font-bold text-adaptive mb-3">{step.title}</h3>
                  <p className="text-neutral-300 leading-relaxed">{step.desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits with Image */}
      <section className="bg-white/5 py-24 border-y border-white/5">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block px-4 py-1 rounded-full bg-success/20 text-success text-sm font-medium mb-4">
                Les benefices
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-adaptive mb-8">Ce que vous gagnez</h2>
              <div className="space-y-6">
                {[
                  { title: "Gain de temps massif", text: "Divisez par 4 le temps passe sur la prospection manuelle. Focalisez-vous sur les deals.", icon: <Clock className="text-success" /> },
                  { title: "Regularite implacable", text: "Soyez present tous les jours, meme quand vous etes en reunion. La constance fait la difference.", icon: <Target className="text-success" /> },
                  { title: "Qualite des echanges", text: "Generez des messages ultra-personnalises qui obtiennent des reponses. 40% de taux de reponse moyen.", icon: <Sparkles className="text-success" /> }
                ].map((benefit, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    viewport={{ once: true }}
                    className="flex gap-5 p-5 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                  >
                    <div className="shrink-0 mt-1">{benefit.icon}</div>
                    <div>
                      <h4 className="text-xl font-bold text-adaptive mb-2">{benefit.title}</h4>
                      <p className="text-neutral-400 leading-relaxed">{benefit.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-3xl blur-3xl" />
              <GlassCard className="p-3 border border-white/10 shadow-2xl bg-neutral-900/80 aspect-video relative z-10 overflow-hidden">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGRhc2hib2FyZCUyMGFuYWx5dGljc3xlbnwxfHx8fDE3NzI5NTMwMTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Dashboard Analytics"
                  className="w-full h-full object-cover rounded-lg"
                />
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Video/Demo Section */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-adaptive mb-6">Voyez Lama en action</h2>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">Decouvrez comment transformer votre prospection Linked.In en 2 minutes chrono.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 rounded-3xl blur-2xl" />
          <GlassCard className="p-3 border border-white/20 shadow-2xl relative z-10">
            <div className="aspect-video bg-neutral-900 rounded-lg flex items-center justify-center group cursor-pointer hover:bg-neutral-800 transition-all relative overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1683721003111-070bcc053d8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaW5rZWRpbiUyMHNvY2lhbCUyMG1lZGlhJTIwbWFya2V0aW5nfGVufDF8fHx8MTc3Mjk5MzU3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Linked.In Marketing Demo"
                className="w-full h-full object-cover rounded-lg opacity-40 group-hover:opacity-60 transition-all"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform border border-white/20">
                  <PlayCircle size={48} className="text-adaptive" />
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 rounded-full bg-warning/20 text-warning text-sm font-medium mb-4">
            <Users2 className="inline mr-1" size={14} /> Temoignages
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-adaptive mb-6">Rejoint par +10,000 commerciaux</h2>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">Decouvrez comment Lama a transforme leur prospection Linked.In.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { name: "Marie Dubois", role: "SDR chez TechFlow", text: "Depuis que j'utilise Lama, mon taux de reponse a augmente de 40%. L'interface est incroyablement intuitive et l'automatisation me fait gagner 2h par jour !", img: "https://images.unsplash.com/photo-1762341116674-784c5dbedeb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHBlcnNvbiUyMGxhcHRvcHxlbnwxfHx8fDE3NzI4OTAyNzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
            { name: "Julien Martin", role: "Fondateur, GrowthAgency", text: "Le meilleur outil de prospection Linked.In du marche. L'approche est beaucoup plus humaine que les autres bots. J'ai signe 3 gros clients ce mois-ci grace a Lama.", img: "https://images.unsplash.com/photo-1716749652823-92e7e6bf7623?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMHNhbGVzJTIwcGVyc29uJTIwY2VsZWJyYXRpbmd8ZW58MXx8fHwxNzcyOTkzNTc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
            { name: "Sophie Leroux", role: "Sales Executive", text: "Les templates de l'e-book couples a l'extension m'ont permis de signer 3 gros contrats ce mois-ci. ROI incroyable pour seulement 9EUR/mois !" }
          ].map((testi, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-8 h-full flex flex-col hover:border-primary/30 transition-all">
                <div className="flex text-warning mb-5">
                  {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                </div>
                <p className="text-neutral-300 mb-8 italic leading-relaxed flex-1">"{testi.text}"</p>
                <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                  {testi.img ? (
                    <ImageWithFallback
                      src={testi.img}
                      alt={testi.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-adaptive text-xl">
                      {testi.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-adaptive font-semibold">{testi.name}</h4>
                    <p className="text-neutral-500 text-sm">{testi.role}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-adaptive mb-4">Questions frequentes</h2>
          <p className="text-neutral-400">Tout ce que vous devez savoir sur Lama Linked.In</p>
        </div>
        <div className="space-y-4 mb-16">
          {[
            { q: "Est-ce securise pour mon compte Linked.In ?", a: "Oui, Lama simule un comportement humain avec des limites strictes pour proteger votre compte. Nous respectons les limites de Linked.In et utilisons des delais aleatoires entre chaque action." },
            { q: "L'extension est-elle gratuite ?", a: "Il existe une version gratuite limitee a 10 requetes/jour, et une version Premium a 9EUR/mois plus complete avec 100 requetes/jour et tous les templates." },
            { q: "Ai-je besoin de Sales Navigator ?", a: "Non, Lama fonctionne avec la version standard de Linked.In, mais Sales Navigator est un plus pour acceder a plus de filtres avances." },
            { q: "Puis-je annuler mon abonnement a tout moment ?", a: "Absolument ! Vous pouvez annuler en 1 clic depuis votre tableau de bord. Pas d'engagement, pas de frais caches." },
            { q: "Quel est le delai pour voir des resultats ?", a: "La plupart de nos utilisateurs voient leurs premiers resultats dans les 7 premiers jours. En moyenne, vous pouvez esperer 20-30 nouvelles connexions qualifiees par semaine." }
          ].map((faq, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              viewport={{ once: true }}
            >
              <GlassCard className="p-6 hover:bg-white/10 transition-all">
                <h4 className="text-adaptive font-semibold mb-3 flex items-start gap-3 text-lg">
                  <Shield size={20} className="text-primary shrink-0 mt-1" /> {faq.q}
                </h4>
                <p className="text-neutral-400 leading-relaxed pl-8">{faq.a}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full mb-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <GlassCard className="p-12 md:p-16 text-center bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 border-primary/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_50%)]" />
            <div className="relative z-10">
              <div className="inline-block mb-6 px-4 py-2 rounded-full bg-accent/20 text-accent text-sm font-bold">
                Offre limitee - Plus que 127 places disponibles
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-adaptive mb-6">Pret a accelerer votre croissance ?</h2>
              <p className="text-xl text-neutral-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Rejoignez les 10,000+ commerciaux qui ont deja transforme leur prospection Linked.In avec Lama.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Link to="/lead-magnet">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-10 shadow-[0_0_30px_rgba(139,92,246,0.4)]">
                    Obtenir l'E-book Gratuit
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-10 border-2 border-white/30">
                    Voir les tarifs <ArrowRight className="ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-400">
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-success" /> Pas de carte bancaire requise</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-success" /> Installation en 2 minutes</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-success" /> Support 24/7</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </section>
    </div>
  );
}
