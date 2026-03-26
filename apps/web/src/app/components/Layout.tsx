import { Outlet, Link, useNavigate } from 'react-router';
import { User, Menu, X, Sun, Moon, Monitor, LogOut, LayoutDashboard, Settings, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../lib/auth';

export function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, setTheme, effectiveTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeOptions = [
    { value: 'light' as const, icon: <Sun size={16} />, label: 'Clair' },
    { value: 'dark' as const, icon: <Moon size={16} />, label: 'Sombre' },
    { value: 'system' as const, icon: <Monitor size={16} />, label: 'Systeme' }
  ];

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <nav className="sticky top-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-adaptive">
            <span className="text-accent text-2xl">&#x1f999;</span>
            Lama<span className="text-primary font-light">Linked.In</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/lead-magnet" className="text-sm font-medium text-adaptive-muted hover:text-adaptive transition-colors">Ressources</Link>
            <Link to="/pricing" className="text-sm font-medium text-adaptive-muted hover:text-adaptive transition-colors">Tarifs</Link>

            {/* Theme Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex items-center gap-2 text-sm font-medium text-adaptive-muted hover:text-adaptive transition-colors bg-white/5 dark:bg-white/5 light:bg-black/5 px-4 py-2 rounded-full border border-adaptive hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/10"
              >
                {effectiveTheme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                <span className="hidden lg:inline">Theme</span>
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-48 glass-card p-2 space-y-1">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setTheme(option.value);
                        setShowThemeMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        theme === option.value
                          ? 'bg-primary/20 text-primary font-medium'
                          : 'text-adaptive-muted hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5'
                      }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Section */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 text-sm font-medium text-adaptive-muted hover:text-adaptive transition-colors bg-white/5 dark:bg-white/5 light:bg-black/5 px-4 py-2 rounded-full border border-adaptive hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/10"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown size={14} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 glass-card p-2 space-y-1">
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-sm font-medium text-adaptive truncate">{user.name}</p>
                      <p className="text-xs text-adaptive-muted truncate">{user.email}</p>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium mt-1 capitalize">
                        {user.tier}
                      </span>
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-adaptive-muted hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5 transition-colors"
                    >
                      <LayoutDashboard size={16} /> Dashboard
                    </Link>
                    <Link
                      to="/account"
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-adaptive-muted hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5 transition-colors"
                    >
                      <Settings size={16} /> Mon Compte
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
                    >
                      <LogOut size={16} /> Deconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-adaptive-muted hover:text-adaptive transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-2 text-sm font-medium bg-primary text-white px-4 py-2 rounded-full hover:bg-primary-dark transition-colors"
                >
                  <User size={16} /> S'inscrire
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden text-adaptive p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full glass-nav border-t border-adaptive py-4 px-4 flex flex-col gap-4">
            <Link to="/lead-magnet" onClick={() => setIsMenuOpen(false)} className="text-adaptive-muted hover:text-adaptive">Ressources</Link>
            <Link to="/pricing" onClick={() => setIsMenuOpen(false)} className="text-adaptive-muted hover:text-adaptive">Tarifs</Link>

            {/* Mobile Theme Selector */}
            <div className="border-t border-adaptive pt-4 space-y-2">
              <div className="text-xs text-adaptive-subtle uppercase tracking-wide mb-2">Theme</div>
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    theme === option.value
                      ? 'bg-primary/20 text-primary font-medium'
                      : 'text-adaptive-muted hover:bg-white/5 dark:hover:bg-white/5 light:hover:bg-black/5'
                  }`}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>

            {/* Mobile Auth */}
            <div className="border-t border-adaptive pt-4">
              {user ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 px-2 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-adaptive">{user.name}</p>
                      <p className="text-xs text-adaptive-muted">{user.email}</p>
                    </div>
                  </div>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-adaptive-muted hover:text-adaptive px-2 py-2">
                    <LayoutDashboard size={16} /> Dashboard
                  </Link>
                  <Link to="/account" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-adaptive-muted hover:text-adaptive px-2 py-2">
                    <Settings size={16} /> Mon Compte
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-danger px-2 py-2 w-full">
                    <LogOut size={16} /> Deconnexion
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-adaptive-muted hover:text-adaptive">
                    Connexion
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-adaptive-muted hover:text-adaptive">
                    <User size={16} /> S'inscrire
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-white/10 dark:border-white/10 py-12 mt-auto bg-neutral-900/50 dark:bg-neutral-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-neutral-400 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="text-accent text-xl">&#x1f999;</span>
            <span>&copy; 2026 Lama. Tous droits reserves.</span>
          </div>
          <div className="flex gap-6">
            <Link to="/pricing" className="hover:text-neutral-50 dark:hover:text-white transition-colors">Tarifs</Link>
            <Link to="/legal" className="hover:text-neutral-50 dark:hover:text-white transition-colors">Mentions legales & RGPD</Link>
            <a href="#" className="hover:text-neutral-50 dark:hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
