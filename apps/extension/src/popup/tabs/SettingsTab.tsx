import { useState, useEffect, useRef } from 'react';
import { Clock, Coffee, Target, Zap, Save, Upload, Crown, ExternalLink, User, CreditCard, BarChart3 } from 'lucide-react';
import { Button, Card, Slider, Toggle } from '@/components/core';
import { useStore } from '../store';

const SITE_URL = 'https://lamalinked.in';

export function SettingsTab() {
  const { config, updateConfig } = useStore();
  const [local, setLocal] = useState(config);
  const [saved, setSaved] = useState(false);
  const [csvMsg, setCsvMsg] = useState('');
  const csvRef = useRef<HTMLInputElement>(null);

  useEffect(() => setLocal(config), [config]);

  const update = <K extends keyof typeof local>(key: K, val: typeof local[K]) => {
    setLocal(prev => ({ ...prev, [key]: val }));
  };

  const isPremium = config.tier === 'premium';

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 0) {
        setLocal(prev => ({ ...prev, customMessages: [...prev.customMessages, ...lines] }));
        setCsvMsg(`${lines.length} message(s) importé(s) !`);
      } else {
        setCsvMsg('Aucun message trouvé.');
      }
      setTimeout(() => setCsvMsg(''), 3000);
    };
    reader.readAsText(file);
    if (csvRef.current) csvRef.current.value = '';
  };

  const save = async () => {
    await updateConfig(local);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 bg-background-elevated border-b border-border">
        <h2 className="text-base font-bold text-foreground">Paramètres</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Session Duration */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            Durée de session
          </label>
          <Card padding="sm">
            <Slider value={local.sessionDurationMin} onChange={v => update('sessionDurationMin', v)} min={15} max={90} unit=" min" label="" />
          </Card>
          <p className="text-xs text-muted-foreground">Recommandé : 25-45 minutes</p>
        </div>

        {/* Pause Duration */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Coffee className="w-4 h-4 text-accent" />
            Durée des pauses
          </label>
          <Card padding="sm">
            <Slider value={local.pauseDurationMin} onChange={v => update('pauseDurationMin', v)} min={5} max={30} unit=" min" label="" />
          </Card>
        </div>

        {/* Objectives */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Target className="w-4 h-4 text-primary" />
            Objectifs par session
          </label>
          <div className="space-y-2">
            <Card padding="sm">
              <Slider value={local.likesPerSession} onChange={v => update('likesPerSession', v)} min={0} max={150} label="Likes" />
            </Card>
            <Card padding="sm">
              <Slider value={local.commentsPerSession} onChange={v => update('commentsPerSession', v)} min={0} max={10} label="Commentaires" />
            </Card>
          </div>
        </div>

        {/* Agent-specific settings */}
        {local.mode === 'agent' && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Zap className="w-4 h-4 text-warning" />
              Réglages Agent
            </label>
            <Card padding="sm">
              <Slider value={local.sessionsPerDay} onChange={v => update('sessionsPerDay', v)} min={1} max={10} label="Sessions / jour" />
            </Card>
            <Card padding="sm">
              <Slider value={local.totalResponsesMax} onChange={v => update('totalResponsesMax', v)} min={1} max={50} label="Actions max / session" />
            </Card>
            <Card padding="sm">
              <Toggle checked={local.refreshAfterSession} onCheckedChange={v => update('refreshAfterSession', v)} label="Rafraîchir le feed après session" />
            </Card>

            {/* CSV Import for custom messages */}
            <Card padding="sm">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Messages personnalisés</span>
                  {!isPremium && <Crown className="w-3.5 h-3.5 text-accent" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Importez un CSV avec vos réponses (1 message par ligne).
                  {local.customMessages.length > 0 && ` ${local.customMessages.length} message(s) chargé(s).`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => isPremium ? csvRef.current?.click() : setCsvMsg('Fonctionnalité Premium')}
                    className={`flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium transition-all ${
                      isPremium
                        ? 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                        : 'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    Importer CSV
                    {!isPremium && <Crown className="w-3 h-3 text-accent" />}
                  </button>
                  {local.customMessages.length > 0 && (
                    <button
                      onClick={() => setLocal(prev => ({ ...prev, customMessages: [] }))}
                      className="h-8 px-3 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                    >
                      Vider
                    </button>
                  )}
                </div>
                <input ref={csvRef} type="file" accept=".csv,.txt" onChange={handleCsvImport} className="hidden" />
                {csvMsg && <p className="text-xs text-green-600 font-medium">{csvMsg}</p>}
              </div>
            </Card>
          </div>
        )}

        {/* Alerts */}
        <Card padding="sm">
          <Toggle
            checked={local.alertsActive}
            onCheckedChange={v => update('alertsActive', v)}
            label="Alertes actives"
            description="Notifications en cas de limite atteinte"
          />
        </Card>

        {/* Account & Website Links */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <User className="w-4 h-4 text-primary" />
            Mon Compte
          </label>
          <div className="space-y-1.5">
            <button
              onClick={() => chrome.tabs.create({ url: `${SITE_URL}/account` })}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-background-elevated hover:bg-muted border border-border transition-all"
            >
              <span className="flex items-center gap-2 text-foreground">
                <User className="w-3.5 h-3.5 text-primary" />
                Gérer mon profil
              </span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </button>
            <button
              onClick={() => chrome.tabs.create({ url: `${SITE_URL}/account` })}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-background-elevated hover:bg-muted border border-border transition-all"
            >
              <span className="flex items-center gap-2 text-foreground">
                <CreditCard className="w-3.5 h-3.5 text-accent" />
                Gérer mon abonnement
              </span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </button>
            <button
              onClick={() => chrome.tabs.create({ url: `${SITE_URL}/dashboard` })}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-background-elevated hover:bg-muted border border-border transition-all"
            >
              <span className="flex items-center gap-2 text-foreground">
                <BarChart3 className="w-3.5 h-3.5 text-green-500" />
                Voir mes statistiques
              </span>
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-background-elevated border-t border-border">
        <Button fullWidth onClick={save} loading={false}>
          <Save className="w-4 h-4" />
          {saved ? 'Enregistré !' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  );
}
