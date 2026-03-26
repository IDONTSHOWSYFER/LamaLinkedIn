import { useState, useRef } from 'react';
import { Copy, FileText, Search, Check, Upload, Crown, MessageSquare, Heart, UserPlus, Award, Lightbulb, Handshake } from 'lucide-react';
import { Card, Badge } from '@/components/core';
import { Template } from '@/types';
import { useStore } from '../store';

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Commentaire appréciation',
    category: 'Réseau',
    content: 'Merci pour ce partage {nom} ! J\'apprécie particulièrement votre point sur {sujet}. Continuez comme ça !',
    variables: ['nom', 'sujet'],
    premium: false,
  },
  {
    id: '2',
    name: 'Question engageante',
    category: 'Prospect',
    content: 'Question intéressante ! Comment gérez-vous {défi} dans votre contexte ? J\'aimerais avoir votre retour.',
    variables: ['défi'],
    premium: false,
  },
  {
    id: '3',
    name: 'Partage d\'expérience',
    category: 'Expert',
    content: 'J\'ai vécu une situation similaire avec {exemple}. Voici ce qui a fonctionné pour nous...',
    variables: ['exemple'],
    premium: false,
  },
  {
    id: '4',
    name: 'Félicitations promotion',
    category: 'Réseau',
    content: 'Félicitations {nom} pour cette belle avancée ! Bien méritée au vu de votre parcours.',
    variables: ['nom'],
    premium: false,
  },
  {
    id: '5',
    name: 'Rebond pertinent',
    category: 'Expert',
    content: 'C\'est un sujet clé ! J\'ajouterais que {point} est souvent sous-estimé. Qu\'en pensez-vous ?',
    variables: ['point'],
    premium: false,
  },
  {
    id: '6',
    name: 'Encouragement',
    category: 'Réseau',
    content: 'Bravo {nom} pour ce post ! C\'est exactement le type de contenu dont Linked.In a besoin.',
    variables: ['nom'],
    premium: false,
  },
  {
    id: '7',
    name: 'Demande de connexion',
    category: 'Prospect',
    content: 'Bonjour {nom}, votre expertise en {sujet} m\'intéresse beaucoup. Seriez-vous ouvert(e) à échanger ?',
    variables: ['nom', 'sujet'],
    premium: true,
  },
  {
    id: '8',
    name: 'Réponse experte',
    category: 'Expert',
    content: 'Excellent point ! Dans mon expérience, {exemple} a permis de résoudre ce type de problème efficacement.',
    variables: ['exemple'],
    premium: true,
  },
  {
    id: '9',
    name: 'Pitch subtil',
    category: 'Prospect',
    content: 'Très bon sujet {nom}. Chez nous, on a développé une approche sur {sujet} qui pourrait vous intéresser. On en discute ?',
    variables: ['nom', 'sujet'],
    premium: true,
  },
  {
    id: '10',
    name: 'Retour d\'expérience détaillé',
    category: 'Expert',
    content: 'J\'ai exactement vécu ça avec {contexte}. Ce qui a changé la donne : {solution}. Ça peut sûrement vous aider aussi.',
    variables: ['contexte', 'solution'],
    premium: true,
  },
];

const CSV_INSTRUCTIONS = `Format CSV attendu :
nom;catégorie;contenu;variables

Exemple :
Merci pro;Réseau;Merci {nom} pour ce partage !;nom
Question RH;Prospect;Comment recrutez-vous en {domaine} ?;domaine

- Séparateur : point-virgule (;)
- Catégories : Réseau, Prospect, Expert
- Variables entre {accolades} dans le contenu
- Plusieurs variables séparées par des virgules`;

export function TemplatesTab() {
  const { config } = useStore();
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [showCsvHelp, setShowCsvHelp] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const isPremium = config.tier === 'premium';

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates];
  const filtered = allTemplates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.content.toLowerCase().includes(search.toLowerCase())
  );

  const copyTemplate = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categoryVariant = (cat: string) => {
    if (cat === 'Réseau') return 'assist';
    if (cat === 'Prospect') return 'agent';
    return 'success';
  };

  const categoryIcon = (cat: string) => {
    if (cat === 'Réseau') return Heart;
    if (cat === 'Prospect') return UserPlus;
    return Lightbulb;
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      // Skip header if present
      const start = lines[0]?.toLowerCase().includes('nom') ? 1 : 0;
      const imported: Template[] = [];

      for (let i = start; i < lines.length; i++) {
        const parts = lines[i].split(';').map(s => s.trim());
        if (parts.length < 3) continue;
        const [name, category, content, vars] = parts;
        const validCat = ['Réseau', 'Prospect', 'Expert'].includes(category) ? category as 'Réseau' | 'Prospect' | 'Expert' : 'Réseau';
        const variables = vars ? vars.split(',').map(v => v.trim()) : [];
        imported.push({
          id: `csv-${Date.now()}-${i}`,
          name,
          category: validCat,
          content,
          variables,
          premium: false,
        });
      }

      if (imported.length > 0) {
        setCustomTemplates(prev => [...prev, ...imported]);
        // Save to storage
        chrome.storage.local.get('lbp_custom_templates', (r) => {
          const existing = r.lbp_custom_templates || [];
          chrome.storage.local.set({ lbp_custom_templates: [...existing, ...imported] });
        });
        setImportMsg(`${imported.length} template(s) importé(s) !`);
      } else {
        setImportMsg('Aucun template valide trouvé dans le fichier.');
      }
      setTimeout(() => setImportMsg(''), 3000);
    };
    reader.readAsText(file);
    // Reset input
    if (fileRef.current) fileRef.current.value = '';
  };

  // Load custom templates on mount
  useState(() => {
    chrome.storage.local.get('lbp_custom_templates', (r) => {
      if (r.lbp_custom_templates?.length) {
        setCustomTemplates(r.lbp_custom_templates);
      }
    });
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 bg-background-elevated border-b border-border">
        <h2 className="text-base font-bold text-foreground mb-3">Templates</h2>
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un template..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* CSV Import - Premium feature */}
        <div className="flex gap-2">
          <button
            onClick={() => isPremium ? fileRef.current?.click() : setShowCsvHelp(true)}
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
          <button
            onClick={() => setShowCsvHelp(!showCsvHelp)}
            className="w-8 h-8 bg-muted hover:bg-border border border-border rounded-lg flex items-center justify-center transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleCsvImport} className="hidden" />

        {/* Import feedback */}
        {importMsg && (
          <div className="mt-2 text-xs text-success font-medium">{importMsg}</div>
        )}
      </div>

      {/* CSV Help */}
      {showCsvHelp && (
        <div className="p-3 bg-primary/5 border-b border-primary/10">
          <pre className="text-[10px] text-foreground-muted whitespace-pre-wrap leading-relaxed font-mono">
            {CSV_INSTRUCTIONS}
          </pre>
          {!isPremium && (
            <div className="mt-2 flex items-center gap-1 text-xs text-accent font-medium">
              <Crown className="w-3 h-3" /> Fonctionnalité Premium
            </div>
          )}
        </div>
      )}

      {/* Template count */}
      <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
        {filtered.length} template{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
        {customTemplates.length > 0 && ` (dont ${customTemplates.length} importé${customTemplates.length > 1 ? 's' : ''})`}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.map((template) => {
          const Icon = categoryIcon(template.category);
          const locked = template.premium && !isPremium;
          return (
            <Card key={template.id} padding="sm" hover className={locked ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                </div>
                <Badge variant={categoryVariant(template.category) as any}>{template.category}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2.5 leading-relaxed">{template.content}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2.5 flex-wrap">
                {template.variables.map(v => (
                  <span key={v} className="bg-muted px-2 py-0.5 rounded border border-border">
                    {'{'}<span className="text-primary">{v}</span>{'}'}
                  </span>
                ))}
                {locked && (
                  <span className="bg-accent/15 text-accent-foreground px-2 py-0.5 rounded text-xs ml-auto flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" /> Premium
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyTemplate(template)}
                  disabled={locked}
                  className="flex-1 h-8 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-50"
                >
                  {copiedId === template.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedId === template.id ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
