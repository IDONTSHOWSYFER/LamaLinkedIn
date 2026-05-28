import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, ArrowRight, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { api } from '../lib/api';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Le lien est invalide ou a expiré. Demandez un nouveau lien.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-16 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/15 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-adaptive mb-6">
            <span className="text-accent text-3xl">&#x1f999;</span>
            Lama<span className="text-primary font-light">Linked.In</span>
          </Link>
          <h1 className="text-3xl font-bold text-adaptive mb-2">Nouveau mot de passe</h1>
          <p className="text-neutral-400">Choisissez un nouveau mot de passe sécurisé</p>
        </div>

        <GlassCard className="p-8 border-white/20 relative">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

          {done ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <p className="text-adaptive font-medium mb-2">Mot de passe réinitialisé</p>
              <p className="text-neutral-400 text-sm mb-6">
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe. Redirection en cours...
              </p>
              <Link to="/login" className="text-primary font-medium hover:text-primary-dark transition-colors text-sm">
                Aller à la connexion
              </Link>
            </div>
          ) : !token ? (
            <div className="text-center py-4">
              <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
              <p className="text-adaptive font-medium mb-2">Lien invalide</p>
              <p className="text-neutral-400 text-sm mb-6">
                Ce lien de réinitialisation est incomplet ou a expiré. Demandez-en un nouveau.
              </p>
              <Link to="/forgot-password" className="text-primary font-medium hover:text-primary-dark transition-colors text-sm">
                Demander un nouveau lien
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-neutral-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="block w-full pl-10 pr-12 py-3 border border-white/10 rounded-lg bg-neutral-900/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Au moins 6 caractères"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-500 hover:text-neutral-300"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-neutral-300 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-neutral-500" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirm"
                      className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg bg-neutral-900/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Répétez le mot de passe"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full text-lg shadow-[0_0_20px_rgba(10,102,194,0.3)]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Zap className="mr-2 animate-spin" size={20} /> Réinitialisation...
                    </>
                  ) : (
                    <>
                      Réinitialiser <ArrowRight className="ml-2" size={20} />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                <Link
                  to="/login"
                  className="text-neutral-400 text-sm hover:text-primary transition-colors"
                >
                  Retour à la connexion
                </Link>
              </div>
            </>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
