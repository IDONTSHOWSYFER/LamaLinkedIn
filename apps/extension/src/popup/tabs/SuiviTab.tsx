import { useState, useEffect } from 'react';
import { Filter, Calendar, MessageCircle, ThumbsUp, TrendingUp } from 'lucide-react';
import { Card, Badge } from '@/components/core';
import { useStore } from '../store';
import { ActionEvent } from '@/types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function SuiviTab() {
  const { events, refreshEvents, session } = useStore();
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => { refreshEvents(); }, []);

  const now = Date.now();
  const periodMs = { today: 24*60*60*1000, week: 7*24*60*60*1000, month: 30*24*60*60*1000 };
  const filtered = events.filter(e => now - e.timestamp < periodMs[period]);

  const likes = filtered.filter(e => e.type === 'like').length;
  const comments = filtered.filter(e => e.type === 'comment').length;
  const sessions = new Set(filtered.map(e => new Date(e.timestamp).toDateString())).size || (session.startedAt ? 1 : 0);

  // Chart data - group by hour for today, by day for week/month
  const chartData = (() => {
    const buckets: Record<string, number> = {};
    filtered.forEach(e => {
      const d = new Date(e.timestamp);
      const key = period === 'today' ? `${d.getHours()}h` : `${d.getDate()}/${d.getMonth()+1}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });
    return Object.entries(buckets).map(([name, actions]) => ({ name, actions }));
  })();

  const tagVariant = (tag: string) => {
    if (tag === 'Réseau') return 'assist';
    if (tag === 'Prospect') return 'agent';
    return 'success';
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 bg-background-elevated border-b border-border">
        <h2 className="text-base font-bold text-foreground mb-3">Suivi & Historique</h2>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as any)}
            className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
          <button className="w-10 h-10 bg-background hover:bg-muted border border-border rounded-xl flex items-center justify-center transition-all">
            <Filter className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 bg-background-elevated border-b border-border">
        <div className="grid grid-cols-3 gap-3">
          <Card padding="sm" className="text-center">
            <div className="text-xl font-bold text-primary">{likes}</div>
            <div className="text-xs text-muted-foreground">Likes</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl font-bold text-accent">{comments}</div>
            <div className="text-xs text-muted-foreground">Comments</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl font-bold text-foreground">{sessions}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </Card>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="px-4 pt-3">
          <Card padding="sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Croissance</span>
            </div>
            <ResponsiveContainer width="100%" height={80}>
              <LineChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                <YAxis hide />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, background: 'var(--background-elevated)', border: '1px solid var(--border)' }} />
                <Line type="monotone" dataKey="actions" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Activity list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">Aucune activité pour cette période</p>
          </div>
        ) : (
          filtered.slice(0, 20).map((event) => (
            <Card key={event.id} padding="sm" hover>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {event.type === 'comment' ? (
                    <MessageCircle className="w-4 h-4 text-accent" />
                  ) : (
                    <ThumbsUp className="w-4 h-4 text-primary" />
                  )}
                  <span className="text-xs font-semibold text-foreground capitalize">{event.type === 'like' ? 'Like' : 'Commentaire'}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(event.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-1.5 leading-relaxed line-clamp-2">{event.content}</p>
              <div className="flex items-center gap-2">
                <Badge variant={tagVariant(event.authorTag) as any}>{event.authorTag}</Badge>
                <span className="text-xs text-muted-foreground">{event.authorName}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
