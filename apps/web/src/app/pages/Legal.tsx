import { Shield, Mail, Trash2, FileText, Lock, Cookie, Eye, Scale, Users } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

export function Legal() {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'cookies'>('privacy');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState('');

  const handleDeleteData = async () => {
    if (!user) { navigate('/login'); return; }
    if (confirmText.trim().toUpperCase() !== 'CONFIRMER') return;
    setDeleting(true);
    setDeleteMsg('');
    try {
      await api('/auth/me', { method: 'DELETE' });
      logout();
      navigate('/');
    } catch (err) {
      setDeleting(false);
      setDeleteMsg(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    }
  };

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
            <h1 className="text-4xl md:text-5xl font-bold text-adaptive mb-6">Politique de Confidentialite & RGPD</h1>
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
                  <h2 className="text-2xl font-bold text-adaptive">Collecte minimale de donnees</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <p>
                    Lama s'engage a minimiser la collecte de donnees personnelles. Nous ne stockons que l'adresse email necessaire pour :
                  </p>
                  <ul className="list-disc list-inside space-y-2 pl-4">
                    <li>La gestion de votre compte utilisateur (gratuit)</li>
                    <li>L'affichage de vos statistiques d'activite dans votre tableau de bord</li>
                    <li>L'envoi de l'e-book gratuit (avec votre consentement explicite)</li>
                  </ul>
                  <p className="text-adaptive font-semibold">
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
                  <h2 className="text-2xl font-bold text-adaptive">Conservation et Communications</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <p>
                    Les emails collectes pour le telechargement de l'e-book (Lead Magnet) sont conserves dans un but strict de prospection commerciale (Opt-in).
                  </p>
                  <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                    <h4 className="text-adaptive font-semibold mb-2">Frequence des emails :</h4>
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
                  <h2 className="text-2xl font-bold text-adaptive">Securite des donnees</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <p>Vos donnees sont stockees de maniere securisee :</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="text-adaptive font-semibold mb-2 flex items-center gap-2">
                        <Lock size={16} className="text-success" /> Cryptage SSL/TLS
                      </h4>
                      <p className="text-sm">Toutes les communications sont cryptees</p>
                    </div>
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="text-adaptive font-semibold mb-2 flex items-center gap-2">
                        <Shield size={16} className="text-primary" /> Hebergement securise
                      </h4>
                      <p className="text-sm">Donnees hebergees sur une infrastructure conforme RGPD (UE)</p>
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
                  <h2 className="text-2xl font-bold text-adaptive">Droit a l'oubli et Suppression</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <p>
                    Conformement au RGPD europeen, vous disposez d'un droit d'acces, de rectification et de suppression de vos donnees personnelles.
                  </p>
                  <div className="p-5 rounded-lg bg-primary/10 border border-primary/30">
                    <h4 className="text-adaptive font-semibold mb-3">Vos droits :</h4>
                    <ul className="space-y-2 text-sm">
                      <li>- Droit d'acces a vos donnees</li>
                      <li>- Droit de rectification</li>
                      <li>- Droit a la portabilite</li>
                      <li>- Droit a l'oubli (suppression totale)</li>
                      <li>- Droit d'opposition au traitement</li>
                    </ul>
                  </div>
                  <p className="text-adaptive font-semibold">
                    Pour exercer ces droits, contactez-nous a : <a href="mailto:heycestlelama@gmail.com" className="text-primary underline">heycestlelama@gmail.com</a>
                  </p>
                  {!confirmOpen ? (
                    <Button
                      variant="outline"
                      className="border-danger/50 text-danger hover:bg-danger/10 hover:border-danger"
                      onClick={() => (user ? setConfirmOpen(true) : navigate('/login'))}
                    >
                      <Trash2 className="mr-2" size={16} /> {user ? 'Supprimer mon compte et mes donnees' : 'Se connecter pour supprimer mes donnees'}
                    </Button>
                  ) : (
                    <div className="p-5 rounded-lg bg-danger/10 border border-danger/30 space-y-3">
                      <p className="text-sm text-danger font-medium">
                        Action irreversible. Pour confirmer la suppression definitive de votre compte et de toutes vos donnees, tapez <strong>CONFIRMER</strong> ci-dessous.
                      </p>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="CONFIRMER"
                        className="w-full px-4 py-2.5 rounded-lg border border-danger/40 bg-transparent text-adaptive placeholder:text-adaptive-subtle focus:outline-none focus:ring-2 focus:ring-danger"
                      />
                      {deleteMsg && <p className="text-sm text-danger">{deleteMsg}</p>}
                      <div className="flex gap-3">
                        <Button
                          className="bg-danger hover:bg-danger/80 text-adaptive disabled:opacity-50"
                          onClick={handleDeleteData}
                          disabled={deleting || confirmText.trim().toUpperCase() !== 'CONFIRMER'}
                        >
                          {deleting ? 'Suppression...' : 'Supprimer definitivement'}
                        </Button>
                        <Button variant="outline" onClick={() => { setConfirmOpen(false); setConfirmText(''); setDeleteMsg(''); }}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
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
                  <h2 className="text-2xl font-bold text-adaptive">Conditions Generales de Vente</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <h3 className="text-lg font-semibold text-adaptive">1. Objet</h3>
                  <p>
                    Les presentes conditions regissent l'utilisation de Lama Linked.In, une extension Chrome et un service web proposes <span className="text-adaptive font-semibold">gratuitement</span>.
                  </p>

                  <h3 className="text-lg font-semibold text-adaptive mt-6">2. Gratuite du service</h3>
                  <div className="p-5 rounded-lg bg-success/10 border border-success/30">
                    <p className="text-adaptive font-semibold mb-2">100% gratuit</p>
                    <p className="text-sm">
                      Lama est entierement gratuit. Aucun paiement, aucun abonnement et aucune carte bancaire ne vous seront jamais demandes. Toutes les fonctionnalites (mode Assiste, mode Agent, statistiques, templates) sont accessibles sans frais.
                    </p>
                  </div>

                  <h3 className="text-lg font-semibold text-adaptive mt-6">3. Compte utilisateur</h3>
                  <p>
                    La creation d'un compte est facultative et sert uniquement a synchroniser vos statistiques d'activite dans votre tableau de bord. Vous pouvez supprimer votre compte et vos donnees a tout moment depuis la page Mon Compte.
                  </p>

                  <h3 className="text-lg font-semibold text-adaptive mt-6">4. Responsabilites</h3>
                  <p>
                    Lama est un outil d'automatisation qui respecte les limites imposees par Linked.In. L'utilisateur reste seul responsable de l'usage qu'il fait du service.
                  </p>
                  <p className="text-warning font-semibold">
                    Nous declinons toute responsabilite en cas de suspension ou bannissement de votre compte Linked.In resultant d'un usage abusif de notre extension.
                  </p>

                  <h3 className="text-lg font-semibold text-adaptive mt-6">5. Service fourni en l'etat</h3>
                  <p>
                    Le service etant gratuit, il est fourni "en l'etat", sans garantie de disponibilite continue. Nous nous efforcons d'assurer le bon fonctionnement de Lama mais ne saurions etre tenus responsables d'une interruption temporaire du service.
                  </p>
                </div>
              </section>

              <div className="border-t border-white/10" />

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Scale className="text-accent" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold text-adaptive">Conditions Generales d'Utilisation</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <h3 className="text-lg font-semibold text-adaptive">1. Usage autorise</h3>
                  <p>
                    Lama est concu pour un usage professionnel de prospection B2B sur Linked.In. Tout usage frauduleux, spam ou contraire aux regles de Linked.In est strictement interdit.
                  </p>

                  <h3 className="text-lg font-semibold text-adaptive mt-6">2. Limites d'utilisation</h3>
                  <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm mb-2">Lama est gratuit et accessible a tous, sans quota commercial. Pour proteger votre compte et respecter les regles de Linked.In, un usage raisonnable est applique :</p>
                    <ul className="space-y-2 text-sm">
                      <li>- Des limites anti-abus protegent l'infrastructure et votre compte</li>
                      <li>- Les actions respectent les cadences recommandees par Linked.In</li>
                      <li>- Aucune distinction de plan : toutes les fonctionnalites sont gratuites</li>
                    </ul>
                  </div>

                  <h3 className="text-lg font-semibold text-adaptive mt-6">3. Propriete intellectuelle</h3>
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
                  <h2 className="text-2xl font-bold text-adaptive">Politique de Cookies</h2>
                </div>
                <div className="space-y-4 text-neutral-300 leading-relaxed">
                  <p>
                    Lama utilise des cookies pour ameliorer votre experience utilisateur et analyser l'utilisation du service.
                  </p>

                  <h3 className="text-lg font-semibold text-adaptive mt-6">Types de cookies utilises</h3>

                  <div className="space-y-4">
                    <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="text-adaptive font-semibold mb-2 flex items-center gap-2">
                        <Lock size={16} className="text-success" /> Cookies essentiels (obligatoires)
                      </h4>
                      <p className="text-sm mb-2">Ces cookies sont necessaires au fonctionnement du site :</p>
                      <ul className="text-sm space-y-1 pl-4">
                        <li>- Session utilisateur (authentification)</li>
                        <li>- Preferences de langue</li>
                        <li>- Preferences de theme (clair/sombre)</li>
                      </ul>
                    </div>

                    <div className="p-5 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="text-adaptive font-semibold mb-2 flex items-center gap-2">
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
                      <h4 className="text-adaptive font-semibold mb-2 flex items-center gap-2">
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

                  <h3 className="text-lg font-semibold text-adaptive mt-6">Gestion des cookies</h3>
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
            <h3 className="text-xl font-bold text-adaptive mb-4">Des questions sur nos politiques ?</h3>
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
