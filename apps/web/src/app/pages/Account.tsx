import { useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { User, Mail, Shield, CreditCard, Star, Trash2, Lock, ArrowRight, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';

export function Account() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'subscription' | 'danger'>('profile');

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    try {
      await updateProfile({ name, email });
      setProfileSuccess('Profil mis a jour avec succes.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Erreur lors de la mise a jour.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword.length < 6) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Mot de passe modifie avec succes.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await api('/auth/me', { method: 'DELETE' });
      logout();
    } catch {
      setDeleteLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const data = await api<{ url: string }>('/stripe/portal', { method: 'POST' });
      window.location.href = data.url;
    } catch {
      // Fallback
    }
  };

  if (!user) return null;

  const sections = [
    { id: 'profile' as const, label: 'Profil', icon: <User size={18} /> },
    { id: 'password' as const, label: 'Mot de passe', icon: <Lock size={18} /> },
    { id: 'subscription' as const, label: 'Abonnement', icon: <CreditCard size={18} /> },
    { id: 'danger' as const, label: 'Zone danger', icon: <AlertTriangle size={18} /> },
  ];

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl md:text-4xl font-bold text-adaptive mb-2">Mon Compte</h1>
        <p className="text-neutral-400 mb-10">Gerez vos informations personnelles et votre abonnement</p>

        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <GlassCard className="p-4 space-y-1">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 mb-4 border-b border-white/10 pb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-lg font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-adaptive truncate">{user.name}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium capitalize">
                    <Star size={10} fill="currentColor" /> {user.tier}
                  </span>
                </div>
              </div>

              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary/20 text-primary font-medium'
                      : section.id === 'danger'
                      ? 'text-danger/70 hover:bg-danger/10 hover:text-danger'
                      : 'text-adaptive-muted hover:bg-white/5'
                  }`}
                >
                  {section.icon}
                  {section.label}
                </button>
              ))}
            </GlassCard>
          </div>

          {/* Content */}
          <div className="md:col-span-3">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <GlassCard className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="text-primary" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-adaptive">Informations du profil</h2>
                      <p className="text-sm text-neutral-400">Modifiez vos informations personnelles</p>
                    </div>
                  </div>

                  {profileSuccess && (
                    <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/30 text-success text-sm flex items-center gap-2">
                      <CheckCircle size={16} /> {profileSuccess}
                    </div>
                  )}
                  {profileError && (
                    <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
                      {profileError}
                    </div>
                  )}

                  <form onSubmit={handleProfileUpdate} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">Nom complet</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-neutral-500" />
                        </div>
                        <input
                          type="text"
                          className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg bg-neutral-900/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">Adresse email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-neutral-500" />
                        </div>
                        <input
                          type="email"
                          className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg bg-neutral-900/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={profileLoading}>
                      {profileLoading ? (
                        <>
                          <Zap className="mr-2 animate-spin" size={16} /> Sauvegarde...
                        </>
                      ) : (
                        'Sauvegarder les modifications'
                      )}
                    </Button>
                  </form>
                </GlassCard>
              )}

              {/* Password Section */}
              {activeSection === 'password' && (
                <GlassCard className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <Lock className="text-accent" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-adaptive">Changer le mot de passe</h2>
                      <p className="text-sm text-neutral-400">Securisez votre compte avec un nouveau mot de passe</p>
                    </div>
                  </div>

                  {passwordSuccess && (
                    <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/30 text-success text-sm flex items-center gap-2">
                      <CheckCircle size={16} /> {passwordSuccess}
                    </div>
                  )}
                  {passwordError && (
                    <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">
                      {passwordError}
                    </div>
                  )}

                  <form onSubmit={handlePasswordChange} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">Mot de passe actuel</label>
                      <input
                        type="password"
                        className="block w-full px-4 py-3 border border-white/10 rounded-lg bg-neutral-900/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="Votre mot de passe actuel"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">Nouveau mot de passe</label>
                      <input
                        type="password"
                        className="block w-full px-4 py-3 border border-white/10 rounded-lg bg-neutral-900/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="Minimum 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">Confirmer le nouveau mot de passe</label>
                      <input
                        type="password"
                        className="block w-full px-4 py-3 border border-white/10 rounded-lg bg-neutral-900/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                        placeholder="Retapez le nouveau mot de passe"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                      />
                    </div>
                    <Button type="submit" disabled={passwordLoading}>
                      {passwordLoading ? (
                        <>
                          <Zap className="mr-2 animate-spin" size={16} /> Modification...
                        </>
                      ) : (
                        'Modifier le mot de passe'
                      )}
                    </Button>
                  </form>
                </GlassCard>
              )}

              {/* Subscription Section */}
              {activeSection === 'subscription' && (
                <GlassCard className="p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                      <CreditCard className="text-success" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-adaptive">Abonnement</h2>
                      <p className="text-sm text-neutral-400">Gerez votre plan et votre facturation</p>
                    </div>
                  </div>

                  {/* Current Plan */}
                  <GlassCard className="p-6 mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-adaptive capitalize">Plan {user.tier}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.subscriptionStatus === 'active'
                              ? 'bg-success/20 text-success'
                              : user.subscriptionStatus === 'canceled'
                              ? 'bg-warning/20 text-warning'
                              : 'bg-neutral-700 text-neutral-300'
                          }`}>
                            {user.subscriptionStatus === 'active' ? 'Actif' :
                             user.subscriptionStatus === 'canceled' ? 'Annule' : 'Gratuit'}
                          </span>
                        </div>
                        {user.subscriptionEnd && (
                          <p className="text-sm text-neutral-400">
                            {user.subscriptionStatus === 'canceled' ? 'Expire le' : 'Prochain renouvellement'} :{' '}
                            {new Date(user.subscriptionEnd).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-extrabold text-adaptive">
                          {user.tier === 'free' ? '0' : user.tier === 'premium' ? '9' : '19'}EUR
                        </div>
                        <div className="text-xs text-neutral-400">/mois</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-neutral-300 mb-1">
                      <CheckCircle size={16} className="text-success" />
                      {user.tier === 'free' ? '10 requetes/jour' : user.tier === 'premium' ? '100 requetes/jour' : 'Requetes illimitees'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-300">
                      <CheckCircle size={16} className="text-success" />
                      {user.tier === 'free' ? '3 templates de base' : 'Templates illimites'}
                    </div>
                  </GlassCard>

                  {user.tier === 'free' ? (
                    <div className="space-y-4">
                      <p className="text-neutral-400">
                        Passez a Premium pour debloquer toutes les fonctionnalites et accelerer votre prospection.
                      </p>
                      <Link to="/pricing">
                        <Button size="lg" className="w-full shadow-[0_0_20px_rgba(10,102,194,0.3)]">
                          <Star className="mr-2" size={18} /> Passer a Premium <ArrowRight className="ml-2" size={18} />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button variant="outline" onClick={handleManageBilling} className="w-full">
                        <CreditCard className="mr-2" size={16} /> Gerer la facturation via Stripe
                      </Button>
                      <p className="text-xs text-neutral-500 text-center">
                        Vous serez redirige vers le portail de facturation Stripe pour modifier votre abonnement, mettre a jour votre carte ou telecharger vos factures.
                      </p>
                    </div>
                  )}
                </GlassCard>
              )}

              {/* Danger Zone */}
              {activeSection === 'danger' && (
                <GlassCard className="p-8 border-danger/20">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center">
                      <AlertTriangle className="text-danger" size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-adaptive">Zone danger</h2>
                      <p className="text-sm text-neutral-400">Actions irreversibles sur votre compte</p>
                    </div>
                  </div>

                  <div className="p-6 rounded-lg border border-danger/30 bg-danger/5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-adaptive font-semibold mb-1">Supprimer mon compte</h3>
                        <p className="text-sm text-neutral-400">
                          Cette action est irreversible. Toutes vos donnees seront definitivement supprimees, y compris votre historique, vos templates et vos statistiques.
                        </p>
                      </div>
                    </div>

                    {!showDeleteConfirm ? (
                      <Button
                        variant="outline"
                        className="mt-4 border-danger/50 text-danger hover:bg-danger/10"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="mr-2" size={16} /> Supprimer mon compte
                      </Button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 rounded-lg bg-danger/10 border border-danger/30"
                      >
                        <p className="text-sm text-danger font-medium mb-4">
                          Etes-vous absolument sur ? Cette action ne peut pas etre annulee.
                        </p>
                        <div className="flex gap-3">
                          <Button
                            className="bg-danger hover:bg-danger/80 text-white"
                            onClick={handleDeleteAccount}
                            disabled={deleteLoading}
                          >
                            {deleteLoading ? 'Suppression...' : 'Oui, supprimer definitivement'}
                          </Button>
                          <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                            Annuler
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-xs text-neutral-500">
                    <Shield size={14} className="text-primary" />
                    Conformement au RGPD, vous pouvez demander la suppression de toutes vos donnees.
                  </div>
                </GlassCard>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
