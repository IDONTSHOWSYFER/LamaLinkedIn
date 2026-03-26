import { Crown, Check, Sparkles } from 'lucide-react';
import { Button, Card } from '@/components/core';
import { useStore } from '../store';
import { api } from '@/lib/api';

export function UpgradeTab() {
  const { installId, config } = useStore();

  const handleUpgrade = async () => {
    try {
      const { url } = await api.createCheckout(installId);
      if (url) chrome.tabs.create({ url });
    } catch {
      alert('Serveur Stripe inaccessible. Réessayez plus tard.');
    }
  };

  const features = [
    { title: 'Templates illimités', desc: 'Créez et sauvegardez autant de templates que vous voulez' },
    { title: 'Statistiques avancées', desc: 'Analyses détaillées et graphiques d\'évolution' },
    { title: 'Export de données', desc: 'Exportez votre historique en CSV ou PDF' },
    { title: 'Support prioritaire', desc: 'Assistance rapide par email et chat' },
    { title: 'Mode Agent complet', desc: 'Mouvement de souris, skip posts, messages custom' },
    { title: 'Sans publicité', desc: 'Aucun message promotionnel dans vos commentaires' },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center shadow-md">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm border-2 border-background">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground mb-1.5">Passez à Premium</h2>
            <p className="text-xs text-muted-foreground">Débloquez toutes les fonctionnalités avancées</p>
          </div>

          {/* Features */}
          <div className="space-y-2">
            {features.map((f, i) => (
              <Card key={i} padding="sm" className="flex items-start gap-2.5">
                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-semibold text-foreground mb-0.5">{f.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Price */}
          <div className="text-center py-2">
            <div className="flex items-baseline justify-center gap-1 mb-0.5">
              <span className="text-3xl font-bold text-foreground">9,90€</span>
              <span className="text-sm text-muted-foreground">/mois</span>
            </div>
            <p className="text-[11px] text-muted-foreground">ou 89€/an (économisez 25%)</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-4 bg-background border-t border-border">
        <div className="space-y-2">
          <Button fullWidth variant="accent" onClick={handleUpgrade}>
            <Crown className="w-4 h-4" />
            Passer Premium
          </Button>
          <button className="w-full h-9 text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">
            Plus tard
          </button>
          <p className="text-[11px] text-muted-foreground text-center">Paiement sécurisé via Stripe</p>
        </div>
      </div>
    </div>
  );
}
