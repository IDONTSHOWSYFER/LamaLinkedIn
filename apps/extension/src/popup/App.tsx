import { useState, useEffect } from 'react';
import { LaunchTab } from './tabs/LaunchTab';
import { RunTab } from './tabs/RunTab';
import { SuiviTab } from './tabs/SuiviTab';
import { TemplatesTab } from './tabs/TemplatesTab';
import { SettingsTab } from './tabs/SettingsTab';
import { UpgradeTab } from './tabs/UpgradeTab';
import { ModeToggle } from './components/ModeToggle';
import { useStore } from './store';
import { Play, BarChart3, FileText, Settings, Crown, Sparkles, Sun, Moon } from 'lucide-react';

export function App() {
  const { session, config, init, activeTab, setActiveTab } = useStore();
  const [initialized, setInitialized] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load theme preference
    chrome.storage.local.get('lbp_theme', (r) => {
      const isDark = r.lbp_theme === 'dark';
      setDarkMode(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    });
    init().then(() => setInitialized(true));
  }, []);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    chrome.storage.local.set({ lbp_theme: next ? 'dark' : 'light' });
  };

  if (!initialized) {
    return (
      <div className="w-[380px] h-[600px] bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Show launch screen if never started
  if (session.botState === 'idle' && !session.startedAt && activeTab === 'launch') {
    return (
      <div className="w-[380px] h-[600px] bg-background">
        <LaunchTab />
      </div>
    );
  }

  return (
    <div className="w-[380px] h-[600px] bg-background flex flex-col overflow-hidden">
      {/* Header with mode toggle */}
      <div className="px-4 pt-3 pb-2 bg-background-elevated border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h1 className="text-sm font-bold text-foreground">Lama Linked.In</h1>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex border-b border-border bg-background-elevated">
          {[
            { id: 'run', icon: Play, label: 'Session' },
            { id: 'suivi', icon: BarChart3, label: 'Suivi' },
            { id: 'templates', icon: FileText, label: 'Templates' },
            { id: 'settings', icon: Settings, label: 'Réglages' },
            { id: 'upgrade', icon: Crown, label: 'Premium' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                activeTab === id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'run' && <RunTab />}
          {activeTab === 'suivi' && <SuiviTab />}
          {activeTab === 'templates' && <TemplatesTab />}
          {activeTab === 'settings' && <SettingsTab />}
          {activeTab === 'upgrade' && <UpgradeTab />}
        </div>
      </div>
    </div>
  );
}
