import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Settings, CreditCard, Activity, Users, Download, Star, TrendingUp, Zap, PlayCircle, BookOpen, Target, BarChart3, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';
import { motion } from 'motion/react';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatsData {
  requests: number;
  connections: number;
  messages: number;
  responseRate: number;
  requestsChange: string;
  connectionsRate: string;
  messagesChange: string;
  responseRateChange: string;
  chartData: Array<{ date: string; requetes: number; connexions: number; messages: number }>;
  recentEvents: Array<{ name: string; type: string; status: string; date: string }>;
}

const DEFAULT_CHART_DATA = [
  { date: 'Lun', requetes: 45, connexions: 12, messages: 28 },
  { date: 'Mar', requetes: 62, connexions: 18, messages: 35 },
  { date: 'Mer', requetes: 58, connexions: 15, messages: 42 },
  { date: 'Jeu', requetes: 71, connexions: 22, messages: 38 },
  { date: 'Ven', requetes: 89, connexions: 28, messages: 52 },
  { date: 'Sam', requetes: 34, connexions: 8, messages: 15 },
  { date: 'Dim', requetes: 22, connexions: 5, messages: 10 },
];

export function Dashboard() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<StatsData>(`/events/stats?range=${dateRange}`)
      .then(setStats)
      .catch(() => {
        // Use fallback data if API not available
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, [dateRange]);

  const chartData = stats?.chartData || DEFAULT_CHART_DATA;
  const recentEvents = stats?.recentEvents || [
    { name: "Directeurs Marketing Paris", type: "Campagne", status: "Active", date: "08 Mar 2026" },
    { name: "SDR et Commerciaux", type: "Campagne", status: "Terminee", date: "05 Mar 2026" },
    { name: "Founders B2B SaaS", type: "Campagne", status: "Active", date: "01 Mar 2026" },
  ];

  const statCards = [
    {
      icon: <Activity size={24} />,
      label: 'Requetes',
      value: stats?.requests?.toLocaleString() || '2,450',
      change: stats?.requestsChange || '+12%',
      color: 'primary',
      subtext: `Cette ${dateRange === 'today' ? 'journee' : dateRange === 'week' ? 'semaine' : 'mois'}`
    },
    {
      icon: <Users size={24} />,
      label: 'Profils connectes',
      value: stats?.connections?.toLocaleString() || '342',
      change: stats?.connectionsRate || '28%',
      color: 'accent',
      subtext: "Taux d'acceptation"
    },
    {
      icon: <TrendingUp size={24} />,
      label: 'Messages envoyes',
      value: stats?.messages?.toLocaleString() || '1,284',
      change: stats?.messagesChange || '+18%',
      color: 'success',
      subtext: 'vs periode precedente'
    },
    {
      icon: <BarChart3 size={24} />,
      label: 'Taux de reponse',
      value: stats?.responseRate ? `${stats.responseRate}%` : '38%',
      change: stats?.responseRateChange || '+5%',
      color: 'warning',
      subtext: 'vs periode precedente'
    }
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
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${
            user?.tier === 'pro' ? 'bg-accent/20 text-accent border-accent/30' :
            user?.tier === 'premium' ? 'bg-primary/20 text-primary border-primary/30' :
            'bg-white/10 text-neutral-300 border-white/20'
          }`}>
            <Star size={14} fill="currentColor" /> {user?.tier ? user.tier.charAt(0).toUpperCase() + user.tier.slice(1) : 'Free'}
          </span>
          <Link to="/account">
            <Button variant="outline" size="sm">
              <CreditCard className="mr-2" size={16} /> Gerer l'abonnement
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
      {user?.tier === 'free' && (
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
              <div className="flex items-center gap-2">
                <div className="text-sm text-success font-medium">{stat.change}</div>
                <div className="text-sm text-neutral-500">{stat.subtext}</div>
              </div>
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
                <Area type="monotone" dataKey="requetes" stroke="#0A66C2" fillOpacity={1} fill="url(#colorRequetes)" strokeWidth={2} />
                <Area type="monotone" dataKey="connexions" stroke="#F4B183" fillOpacity={1} fill="url(#colorConnexions)" strokeWidth={2} />
                <Area type="monotone" dataKey="messages" stroke="#16A34A" fillOpacity={1} fill="url(#colorMessages)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-neutral-400">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /> Requetes</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent" /> Connexions</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-success" /> Messages</div>
          </div>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <GlassCard className="p-6 border-white/5 bg-gradient-to-br from-primary/10 to-transparent hover:border-primary/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-adaptive font-semibold">Telecharger l'extension</h3>
            <Download className="text-primary" size={20} />
          </div>
          <p className="text-sm text-neutral-400 mb-6">Lama v2.0 est prete. Assurez-vous d'avoir la derniere version pour profiter de toutes les fonctionnalites.</p>
          <Button variant="primary" size="sm" className="w-full">
            <Download className="mr-2" size={16} /> Installer Chrome Extension
          </Button>
        </GlassCard>

        <GlassCard className="p-6 border-white/5 bg-gradient-to-br from-accent/10 to-transparent hover:border-accent/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-adaptive font-semibold">Tutoriel video</h3>
            <PlayCircle className="text-accent" size={20} />
          </div>
          <p className="text-sm text-neutral-400 mb-6">Decouvrez comment utiliser Lama comme un pro en seulement 5 minutes chrono.</p>
          <Button variant="outline" size="sm" className="w-full border-accent/30 text-accent hover:bg-accent/10">
            <PlayCircle className="mr-2" size={16} /> Regarder le tutoriel
          </Button>
        </GlassCard>

        <GlassCard className="p-6 border-white/5 bg-gradient-to-br from-success/10 to-transparent hover:border-success/30 transition-all">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-adaptive font-semibold">Templates Premium</h3>
            <Star className="text-warning" size={20} />
          </div>
          <p className="text-sm text-neutral-400 mb-6">Accedez a 100+ templates de messages valides par des experts du growth.</p>
          <Button variant="outline" size="sm" className="w-full border-success/30 text-success hover:bg-success/10">
            <BookOpen className="mr-2" size={16} /> Explorer les templates
          </Button>
        </GlassCard>
      </div>

      {/* Recent Activity Table */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-adaptive">Activite recente</h2>
          <Button variant="outline" size="sm">
            <Target className="mr-2" size={16} /> Nouvelle campagne
          </Button>
        </div>

        <GlassCard className="overflow-hidden border-white/5">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="bg-white/5 text-neutral-300 uppercase font-medium text-xs border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Campagne</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentEvents.map((item, i) => (
                <tr key={i} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-adaptive">{item.name}</td>
                  <td className="px-6 py-4">{item.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.status === 'Active' ? 'bg-success/20 text-success' : 'bg-neutral-700 text-neutral-300'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-neutral-400 hover:text-adaptive transition-colors">
                      <Settings size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>

      {/* Upsell */}
      {user?.tier === 'free' && (
        <GlassCard className="p-8 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold mb-3">
                <Zap size={12} /> ASTUCE PRO
              </div>
              <h3 className="text-2xl font-bold text-adaptive mb-2">Boostez vos resultats de 3x</h3>
              <p className="text-neutral-300 mb-4">
                Les utilisateurs qui personnalisent leurs templates obtiennent en moyenne <span className="text-adaptive font-bold">3x plus de reponses</span>. Passez a Premium pour debloquer tous les templates.
              </p>
              <Link to="/pricing">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-neutral-900 font-semibold">
                  Passer a Premium <Star className="ml-2" size={16} />
                </Button>
              </Link>
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
