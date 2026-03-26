import { Shield, Mail, Trash2, FileText, Lock, CreditCard, Cookie, Eye, Scale, Users } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { motion } from 'motion/react';
import { useState } from 'react';

export function Legal() {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'cookies'>('privacy');

  return (
    <div className="flex-1 py-16 px-4">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
              <Scale size={16} /> Mentions legales
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Politique de Confidentialite & RGPD</h1>
            <p className="text-neutral-400 text-lg">Derniere mise a jour : 8 Mars 2026</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {[
            { id: 'privacy' as const, label: 'Confidentialite', icon: <Shield size={16} /> },
            { id: 'terms' as const, label: 'CGV / CGU', icon: <FileText size={16} /> },
            { id: 'cookies' as const, label: 'Cookies', icon: <Cookie size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-primary/20 text-primary border-2 border-primary/30'
                  : 'bg-white/5 text-neutral-400 border-2 border-white/10 hover:border-white/20'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'privacy' && (
            <GlassCard className="p-8 md:p-12 space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Shield className="text-primary" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Collecte minimale de donnees</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <p>
                    Lama s'engage a minimiser la collecte de donnees personnelles. Nous ne stockons que l'adresse email necessaire pour :
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-4">
                    <li>La gestion de votre compte utilisateur</li>
                    <li>La gestion de votre abonnement Premium</li>
                    <li>L'envoi des factures et confirmations de paiement</li>
                    <li>L'envoi de l'e-book gratuit (avec votre consentement explicite)</li>
                  </ul>
                  <p className="text-white font-semibold">
                    Important : Aucune donnee issue de votre navigation Linked.In n'est revendue a des tiers. Jamais.
                  </p>
                </div>
              </section>

              <div className="border-t border-white/10" />

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Mail className="text-accent" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Conservation et Communications</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <p>
                    Les emails collectes pour le telechargement de l'e-book (Lead Magnet) sont conserves dans un but strict de prospection commerciale (Opt-in).
                  </p>
                  <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                    <h4 className="text-white font-semibold mb-2">Frequence des emails :</h4>
                    <ul className="space-y-1 text-sm">
                      <li>- Maximum 2-3 emails par mois</li>
                      <li>- Contenu exclusif : tips, templates, nouveautes</li>
                      <li>- Pas de spam, promis !</li>
                    </ul>
                  </div>
                  <p>
                    Vous pouvez vous desinscrire de nos listes a tout moment via le lien de desabonnement present en bas de chaque email.
                  </p>
                </div>
              </section>

              <div className="border-t border-white/10" />

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
                    <Lock className="text-success" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Securite des donnees</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <p>Vos donnees sont stockees de maniere securisee :</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Lock size={16} className="text-success" /> Cryptage SSL/TLS
                      </h4>
                      <p className="text-sm">Toutes les communications sont cryptees</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <CreditCard size={16} className="text-primary" /> Paiements securises
                      </h4>
                      <p className="text-sm">Geres par Stripe, certifie PCI-DSS</p>
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t border-white/10" />

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-danger/20 flex items-center justify-center">
                    <Trash2 className="text-danger" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Droit a l'oubli et Suppression</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <p>
                    Conformement au RGPD europeen, vous disposez d'un droit d'acces, de rectification et de suppression de vos donnees personnelles.
                  </p>
                  <div className="p-5 rounded-lg bg-primary/10 border border-primary/30">
                    <h4 className="text-white font-semibold mb-3">Vos droits :</h4>
                    <ul className="space-y-2 text-sm">
                      <li>- Droit d'acces a vos donnees</li>
                      <li>- Droit de rectification</li>
                      <li>- Droit a la portabilite</li>
                      <li>- Droit a l'oubli (suppression totale)</li>
                      <li>- Droit d'opposition au traitement</li>
                    </ul>
                  </div>
                  <p className="text-white font-semibold">
                    Pour exercer ces droits, contactez-nous a : <a href="mailto:heycestlelama@gmail.com" className="text-primary underline">heycestlelama@gmail.com</a>
                  </p>
                  <Button variant="outline" className="border-danger/50 text-danger hover:bg-danger/10 hover:border-danger">
                    <Trash2 className="mr-2" size={16} /> Demander la suppression de mes donnees
                  </Button>
                </div>
              </section>
            </GlassCard>
          )}

          {activeTab === 'terms' && (
            <GlassCard className="p-8 md:p-12 space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <FileText className="text-primary" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Conditions Generales de Vente</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <h3 className="text-lg font-semibold text-white">1. Objet</h3>
                  <p>
                    Les presentes CGV regissent la vente des abonnements Lama Linked.In (version Premium et Pro) proposes par Lama SAS.
                  </p>

                  <h3 className="text-lg font-semibold text-white mt-6">2. Prix et Paiement</h3>
                  <ul className="list-disc list-inside space-y-2 pl-4">
                    <li>Les prix sont indiques en Euros, TTC</li>
                    <li>Le paiement s'effectue par carte bancaire via Stripe</li>
                    <li>L'abonnement est renouvele automatiquement chaque mois</li>
                    <li>Vous pouvez annuler a tout moment depuis votre tableau de bord</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-white mt-6">3. Droit de retractation</h3>
                  <p>
                    Conformement a la legislation en vigueur, vous disposez d'un delai de 14 jours pour vous retracter, a compter de la souscription de votre abonnement.
                  </p>

                  <h3 className="text-lg font-semibold text-white mt-6">4. Garantie satisfait ou rembourse</h3>
                  <div className="p-5 rounded-lg bg-success/10 border border-success/30">
                    <p className="text-white font-semibold mb-2">Garantie 14 jours</p>
                    <p className="text-sm">
                      Si vous n'etes pas satisfait de Lama dans les 14 premiers jours, nous vous remboursons integralement. Sans poser de question.
                    </p>
                  </div>

                  <h3 className="text-lg font-semibold text-white mt-6">5. Resiliation</h3>
                  <p>
                    Vous pouvez resilier votre abonnement a tout moment depuis votre tableau de bord. La resiliation prend effet a la fin de la periode de facturation en cours.
                  </p>

                  <h3 className="text-lg font-semibold text-white mt-6">6. Responsabilites</h3>
                  <p>
                    Lama est un outil d'automatisation qui respecte les limites imposees par Linked.In. L'utilisateur reste seul responsable de l'usage qu'il fait du service.
                  </p>
                  <p className="text-warning font-semibold">
                    Nous declinons toute responsabilite en cas de suspension ou bannissement de votre compte Linked.In resultant d'un usage abusif de notre extension.
                  </p>
                </div>
              </section>

              <div className="border-t border-white/10" />

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Scale className="text-accent" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Conditions Generales d'Utilisation</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <h3 className="text-lg font-semibold text-white">1. Usage autorise</h3>
                  <p>
                    Lama est concu pour un usage professionnel de prospection B2B sur Linked.In. Tout usage frauduleux, spam ou contraire aux regles de Linked.In est strictement interdit.
                  </p>

                  <h3 className="text-lg font-semibold text-white mt-6">2. Limites d'utilisation</h3>
                  <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                    <ul className="space-y-2 text-sm">
                      <li>- Plan Free : 10 requetes/jour maximum</li>
                      <li>- Plan Premium : 100 requetes/jour maximum</li>
                      <li>- Plan Pro : Illimite (dans les limites Linked.In)</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-semibold text-white mt-6">3. Propriete intellectuelle</h3>
                  <p>
                    L'extension Lama, les templates et tous les contenus fournis restent la propriete exclusive de Lama SAS. Toute reproduction ou redistribution est interdite.
                  </p>
                </div>
              </section>
            </GlassCard>
          )}

          {activeTab === 'cookies' && (
            <GlassCard className="p-8 md:p-12 space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Cookie className="text-primary" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Politique de Cookies</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <p>
                    Lama utilise des cookies pour ameliorer votre experience utilisateur et analyser l'utilisation du service.
                  </p>

                  <h3 className="text-lg font-semibold text-white mt-6">Types de cookies utilises</h3>

                  <div className="space-y-4">
                    <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Lock size={16} className="text-success" /> Cookies essentiels (obligatoires)
                      </h4>
                      <p className="text-sm mb-2">Ces cookies sont necessaires au fonctionnement du site :</p>
                      <ul className="text-sm space-y-1 pl-4">
                        <li>- Session utilisateur (authentification)</li>
                        <li>- Preferences de langue</li>
                        <li>- Panier d'achat</li>
                      </ul>
                    </div>

                    <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Eye size={16} className="text-primary" /> Cookies analytiques (optionnels)
                      </h4>
                      <p className="text-sm mb-2">Ces cookies nous aident a comprendre comment vous utilisez Lama :</p>
                      <ul className="text-sm space-y-1 pl-4">
                        <li>- Google Analytics (anonymise)</li>
                        <li>- Suivi des performances</li>
                        <li>- A/B testing</li>
                      </ul>
                    </div>

                    <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Users size={16} className="text-accent" /> Cookies marketing (optionnels)
                      </h4>
                      <p className="text-sm mb-2">Ces cookies sont utilises pour la publicite personnalisee :</p>
                      <ul className="text-sm space-y-1 pl-4">
                        <li>- Facebook Pixel</li>
                        <li>- Linked.In Insight Tag</li>
                        <li>- Retargeting ads</li>
                      </ul>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-white mt-6">Gestion des cookies</h3>
                  <p>
                    Vous pouvez a tout moment modifier vos preferences de cookies via les parametres de votre navigateur ou en cliquant sur le bouton ci-dessous :
                  </p>
                  <Button variant="primary" className="mt-4">
                    <Cookie className="mr-2" size={16} /> Gerer mes preferences de cookies
                  </Button>
                </div>
              </section>
            </GlassCard>
          )}
        </motion.div>

        {/* Footer Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <GlassCard className="p-8 bg-white/5 border-white/10 text-center">
            <h3 className="text-xl font-bold text-white mb-4">Des questions sur nos politiques ?</h3>
            <p className="text-neutral-400 mb-6">Notre equipe est la pour vous aider et repondre a toutes vos interrogations.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline">
                <Mail className="mr-2" size={16} /> Contactez-nous
              </Button>
              <Button variant="primary">
                <Shield className="mr-2" size={16} /> Centre de confidentialite
              </Button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Company Info */}
        <div className="mt-8 text-center text-sm text-neutral-500">
          <p>Lama Linked.In - Lama SAS</p>
          <p>heycestlelama@gmail.com - DPO: lamalinked.in</p>
        </div>
      </div>
    </div>
  );
}
