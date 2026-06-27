import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Settings, Activity, Download, Star, TrendingUp, Zap, PlayCircle, BookOpen, Target, BarChart3, Calendar, ExternalLink, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CHROME_EXTENSION_URL = 'https://chromewebstore.google.com/detail/lama-linked-in/mjabdegoelohpjfgcljlphoeffiafdpi';

interface ApiStats {
  likes: number;
  comments: number;
  total: number;
  dailyBreakdown: Array<{ type: string; _count: number }>;
  recentEvents: Array<{ id: string; type: string; authorName?: string; createdAt: string; mode?: string }>;
}

interface StatsData {
  likes: number;
  comments: number;
  total: number;
  chartData: Array<{ date: string; likes: number; comments: number }>;
  recentEvents: Array<{ name: string; type: string; mode: string; date: string }>;
}

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// Construit la série du graphique à partir des vrais évènements (likes vs
// commentaires), regroupés par heure (jour) ou par date (semaine/mois).
function buildChart(events: ApiStats['recentEvents'], period: 'today' | 'week' | 'month') {
  const buckets = new Map<string, { date: string; likes: number; comments: number; ts: number }>();
  for (const e of events) {
    const d = new Date(e.createdAt);
    const key = period === 'today' ? String(d.getHours()) : d.toISOString().slice(0, 10);
    const label = period === 'today'
      ? `${String(d.getHours()).padStart(2, '0')}h`
      : period === 'month'
        ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
        : DAY_LABELS[d.getDay()];
    const b = buckets.get(key) || { date: label, likes: 0, comments: 0, ts: d.getTime() };
    if (e.type === 'like') b.likes++;
    else if (e.type === 'comment') b.comments++;
    buckets.set(key, b);
  }
  return [...buckets.values()].sort((a, b) => a.ts - b.ts).map(({ date, likes, comments }) => ({ date, likes, comments }));
}

export function Dashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    setLoading(true);
    api<ApiStats>(`/events/stats?period=${dateRange}`)
      .then((data) => {
        const mapped: StatsData = {
          likes: data.likes || 0,
          comments: data.comments || 0,
          total: data.total || 0,
          chartData: buildChart(data.recentEvents || [], dateRange),
          recentEvents: (data.recentEvents || []).slice(0, 10).map(e => ({
            name: e.authorName || 'Post LinkedIn',
            type: e.type === 'like' ? 'Like' : e.type === 'comment' ? 'Commentaire' : e.type,
            mode: e.mode === 'agent' ? 'Agent' : 'Assisté',
            date: new Date(e.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
          })),
        };
        setStats(mapped);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [dateRange]);

  const periodLabel = dateRange === 'today' ? "aujourd'hui" : dateRange === 'week' ? 'cette semaine' : 'ce mois';
  const chartData = stats?.chartData || [];
  const recentEvents = stats?.recentEvents || [];

  const statCards = [
    {
      icon: <Activity size={24} />,
      label: 'Actions totales',
      value: (stats?.total ?? 0).toLocaleString('fr-FR'),
      color: 'primary',
      subtext: periodLabel,
    },
    {
      icon: <Star size={24} fill="currentColor" />,
      label: 'Likes',
      value: (stats?.likes ?? 0).toLocaleString('fr-FR'),
      color: 'accent',
      subtext: periodLabel,
    },
    {
      icon: <TrendingUp size={24} />,
      label: 'Commentaires',
      value: (stats?.comments ?? 0).toLocaleString('fr-FR'),
      color: 'success',
      subtext: periodLabel,
    },
    {
      icon: <BarChart3 size={24} />,
      label: 'Moyenne / jour',
      value: (dateRange === 'today'
        ? (stats?.total ?? 0)
        : Math.round((stats?.total ?? 0) / (dateRange === 'week' ? 7 : 30))
      ).toLocaleString('fr-FR'),
      color: 'warning',
      subtext: 'actions',
    },
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-adaptive mb-2">Bonjour, {user?.name?.split(' ')[0] || 'Alex'}</h1>
          <p className="text-neutral-400">Voici un resume de votre activite Linked.In</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border bg-success/20 text-success border-success/30">
            <Star size={14} fill="currentColor" /> Gratuit
          </span>
          <Link to="/account">
            <Button variant="outline" size="sm">
              <Settings className="mr-2" size={16} /> Mon compte
            </Button>
          </Link>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2 mb-8">
        <Calendar size={16} className="text-neutral-400" />
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {[
            { value: 'today' as const, label: "Aujourd'hui" },
            { value: 'week' as const, label: 'Semaine' },
            { value: 'month' as const, label: 'Mois' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setDateRange(option.value)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                dateRange === option.value
                  ? 'bg-primary/20 text-primary'
                  : 'text-neutral-400 hover:bg-white/5'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Onboarding */}
      {user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <GlassCard className="p-6 md:p-8 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
              <Zap size={200} />
            </div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-adaptive mb-2">Demarrez en 3 etapes simples</h2>
                  <p className="text-neutral-400 text-sm">Configurez votre compte pour maximiser vos resultats</p>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/20 px-3 py-1 rounded-full">2/3 complete</span>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { step: 1, title: "Installer l'extension", desc: 'Ajoutez Lama a Chrome', completed: true, icon: <Download size={20} /> },
                  { step: 2, title: 'Configurer vos templates', desc: 'Personnalisez vos messages', completed: true, icon: <BookOpen size={20} /> },
                  { step: 3, title: 'Lancer votre premiere campagne', desc: 'Ciblez vos prospects', completed: false, icon: <Target size={20} /> }
                ].map((item) => (
                  <div key={item.step} className={`p-4 rounded-lg border ${item.completed ? 'bg-success/10 border-success/30' : 'bg-white/5 border-white/10'} transition-all`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.completed ? 'bg-success text-white' : 'bg-white/10 text-neutral-400'}`}>
                        {item.completed ? <span>&#10003;</span> : item.step}
                      </div>
                      <h3 className="font-semibold text-adaptive text-sm">{item.title}</h3>
                    </div>
                    <p className="text-xs text-neutral-400 ml-11">{item.desc}</p>
                    {!item.completed && (
                      <Button size="sm" variant="primary" className="mt-3 ml-11 text-xs">
                        Commencer
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-10">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-6 border-white/5 hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 bg-${stat.color}/20 rounded-lg text-${stat.color}`}>
                  {stat.icon}
                </div>
                <h3 className="text-neutral-400 font-medium text-sm">{stat.label}</h3>
              </div>
              <div className="text-4xl font-bold text-adaptive mb-1">{stat.value}</div>
              <div className="text-sm text-adaptive-muted capitalize">{stat.subtext}</div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <div className="mb-10">
        <GlassCard className="p-6 border-white/5">
          <h2 className="text-xl font-bold text-adaptive mb-6">Activite</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRequetes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A66C2" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0A66C2" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorConnexions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F4B183" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F4B183" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(11, 18, 32, 0.9)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="likes" name="Likes" stroke="#0A66C2" fillOpacity={1} fill="url(#colorRequetes)" strokeWidth={2} />
                <Area type="monotone" dataKey="comments" name="Commentaires" stroke="#F4B183" fillOpacity={1} fill="url(#colorConnexions)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-adaptive-muted">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /> Likes</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent" /> Commentaires</div>
          </div>
          {chartData.length === 0 && !loading && (
            <p className="text-center text-sm text-adaptive-muted mt-4">
              Aucune action enregistrée sur cette période. Connectez-vous et lancez l'extension sur LinkedIn — vos likes et commentaires s'afficheront ici en temps réel.
            </p>
          )}
        </GlassCard>
      </div>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowVideo(false)}>
          <div className="relative w-full max-w-3xl mx-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowVideo(false)} className="absolute -top-10 right-0 text-white hover:text-neutral-300">
              <X size={24} />
            </button>
            <div className="rounded-2xl overflow-hidden bg-neutral-900 shadow-2xl">
              <div className="aspect-video flex flex-col items-center justify-center p-12 text-center">
                <PlayCircle size={64} className="text-accent mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">Comment utiliser Lama Linked.In</h3>
                <div className="space-y-3 text-left text-neutral-300 text-sm max-w-md">
                  <p><span className="text-accent font-semibold">1.</span> Installez l'extension Chrome depuis le Web Store</p>
                  <p><span className="text-accent font-semibold">2.</span> Ouvrez LinkedIn et cliquez sur l'icone Lama</p>
                  <p><span className="text-accent font-semibold">3.</span> Choisissez <strong>Mode Assiste</strong> (controle total) ou <strong>Mode Agent</strong> (automatique)</p>
                  <p><span className="text-accent font-semibold">4.</span> Cliquez <strong>Demarrer</strong> — Lama interagit pour vous</p>
                  <p><span className="text-accent font-semibold">5.</span> Suivez vos stats en temps reel ici dans le dashboard</p>
                </div>
                <p className="text-neutral-500 text-xs mt-6">Video tutoriel bientot disponible</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <GlassCard className="p-6 border-white/5 bg-gradient-to-br from-primary/10 to-transparent hover:border-primary/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-adaptive font-semibold">Telecharger l'extension</h3>
            <Download className="text-primary" size={20} />
          </div>
          <p className="text-sm text-neutral-400 mb-6">Lama v3.0 est prete. Assurez-vous d'avoir la derniere version pour profiter de toutes les fonctionnalites.</p>
          <a href={CHROME_EXTENSION_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="sm" className="w-full">
              <Download className="mr-2" size={16} /> Installer Chrome Extension <ExternalLink className="ml-1" size={12} />
            </Button>
          </a>
        </GlassCard>

        <GlassCard className="p-6 border-white/5 bg-gradient-to-br from-accent/10 to-transparent hover:border-accent/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-adaptive font-semibold">Tutoriel video</h3>
            <PlayCircle className="text-accent" size={20} />
          </div>
          <p className="text-sm text-neutral-400 mb-6">Decouvrez comment utiliser Lama comme un pro en seulement 5 minutes chrono.</p>
          <Button variant="outline" size="sm" className="w-full border-accent/30 text-accent hover:bg-accent/10" onClick={() => setShowVideo(true)}>
            <PlayCircle className="mr-2" size={16} /> Regarder le tutoriel
          </Button>
        </GlassCard>

        <GlassCard className="p-6 border-white/5 bg-gradient-to-br from-success/10 to-transparent hover:border-success/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-adaptive font-semibold">Templates de messages</h3>
            <Star className="text-warning" size={20} />
          </div>
          <p className="text-sm text-neutral-400 mb-6">Des dizaines de templates de messages prets a l'emploi, directement dans l'extension. 100% gratuit.</p>
          <a href={CHROME_EXTENSION_URL} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="w-full border-success/30 text-success hover:bg-success/10">
              <BookOpen className="mr-2" size={16} /> Ouvrir dans l'extension
            </Button>
          </a>
        </GlassCard>
      </div>

      {/* Recent Activity Table */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-adaptive">Activité récente</h2>
        </div>

        <GlassCard className="overflow-hidden border-white/5">
          <table className="w-full text-left text-sm text-adaptive-muted">
            <thead className="bg-white/5 text-adaptive-secondary uppercase font-medium text-xs border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Post / Auteur</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Mode</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-adaptive-muted">
                    Aucune activité pour le moment. Vos likes et commentaires LinkedIn apparaîtront ici.
                  </td>
                </tr>
              ) : recentEvents.map((item, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-adaptive">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.type === 'Like' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
                    }`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.mode}</td>
                  <td className="px-6 py-4">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>

      {/* Tip */}
      {user && (
        <GlassCard className="p-8 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold mb-3">
                <Zap size={12} /> ASTUCE
              </div>
              <h3 className="text-2xl font-bold text-adaptive mb-2">Boostez vos resultats de 3x</h3>
              <p className="text-neutral-300 mb-4">
                Les utilisateurs qui personnalisent leurs templates obtiennent en moyenne <span className="text-adaptive font-bold">3x plus de reponses</span>. Editez vos templates directement dans l'extension.
              </p>
              <a href={CHROME_EXTENSION_URL} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-neutral-900 font-semibold">
                  Ouvrir l'extension <Star className="ml-2" size={16} />
                </Button>
              </a>
            </div>
            <div className="flex-shrink-0">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center border-4 border-accent/30">
                <TrendingUp size={48} className="text-accent" />
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
