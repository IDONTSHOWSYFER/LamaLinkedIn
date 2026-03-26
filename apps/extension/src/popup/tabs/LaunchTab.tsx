import { Sparkles, Settings, Shield, Bot } from 'lucide-react';
import { Button, Badge } from '@/components/core';
import { useStore } from '../store';

export function LaunchTab() {
  const { config, setActiveTab, startBot, toggleMode } = useStore();

  return (
    <div className="h-full flex flex-col p-6 bg-background">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-md">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-accent rounded-full border-2 border-background" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Lama Linked.In</h1>
        <p className="text-sm text-muted-foreground">
          Votre assistant intelligent pour Linked.In
        </p>
      </div>

      {/* Mode selector */}
      <div className="mb-6 flex justify-center">
        <div className="flex items-center bg-muted rounded-full p-1">
          <button
            onClick={() => toggleMode('assist')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
              config.mode === 'assist'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Mode Assisté
          </button>
          <button
            onClick={() => toggleMode('agent')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
              config.mode === 'agent'
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Mode Agent
          </button>
        </div>
      </div>

      {/* Mode description */}
      <div className="mb-6 text-center">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {config.mode === 'assist'
            ? 'Highlights, suggestions et remplissage au clic. Vous gardez le contrôle total.'
            : 'Automatisation complète : likes, commentaires, scroll. Le bot agit pour vous.'}
        </p>
      </div>

      {/* Features */}
      <div className="space-y-2.5 mb-auto">
        <div className="flex items-center gap-3 glass p-3 rounded-xl">
          <div className="w-2 h-2 bg-primary rounded-full" />
          <span className="text-sm font-medium text-foreground">
            {config.mode === 'assist' ? 'Timer de session intelligent' : 'Auto-like & auto-comment'}
          </span>
        </div>
        <div className="flex items-center gap-3 glass p-3 rounded-xl">
          <div className="w-2 h-2 bg-accent rounded-full" />
          <span className="text-sm font-medium text-foreground">
            {config.mode === 'assist' ? 'Templates de messages' : 'Scroll humain & jitter'}
          </span>
        </div>
        <div className="flex items-center gap-3 glass p-3 rounded-xl">
          <div className="w-2 h-2 bg-success rounded-full" />
          <span className="text-sm font-medium text-foreground">
            {config.mode === 'assist' ? 'Suivi des interactions' : 'Multi-sessions & quotas'}
          </span>
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-2.5 mt-4">
        <Button fullWidth size="lg" onClick={() => startBot()}>
          Démarrer
        </Button>
        <Button fullWidth variant="secondary" size="sm" onClick={() => setActiveTab('settings')}>
          <Settings className="w-4 h-4" />
          Configurer
        </Button>
      </div>
    </div>
  );
}
