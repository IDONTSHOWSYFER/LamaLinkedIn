import { useState, useEffect } from 'react';
import { Play, Pause, Square, CheckCircle2, Circle, AlertTriangle, Bot, Shield } from 'lucide-react';
import { Button, Card, Badge, Alert } from '@/components/core';
import { useStore } from '../store';

export function RunTab() {
  const { session, config, startBot, stopBot, pauseBot, resumeBot, refreshSession } = useStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshSession();
      if (session.startedAt && session.botState === 'running') {
        setElapsed(Math.floor((Date.now() - session.startedAt) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [session.startedAt, session.botState]);

  const totalSeconds = config.sessionDurationMin * 60;
  const remaining = Math.max(0, totalSeconds - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) : 0;
  const circumference = 2 * Math.PI * 68;
  const strokeDashoffset = circumference * (1 - progress);

  const isRunning = session.botState === 'running';
  const isPaused = session.botState === 'paused';
  const isIdle = session.botState === 'idle';

  const likePct = session.targetLikes > 0 ? (session.likesThisSession / session.targetLikes) * 100 : 0;
  const commentPct = session.targetComments > 0 ? (session.commentsThisSession / session.targetComments) * 100 : 0;
  const nearLimitComments = session.dailyComments >= 40;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 bg-background-elevated border-b border-border flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Session en cours</h2>
        <Badge variant={config.mode === 'agent' ? 'agent' : 'assist'}>
          {config.mode === 'agent' ? <><Bot className="w-3 h-3 mr-1" /> Agent</> : <><Shield className="w-3 h-3 mr-1" /> Assisté</>}
        </Badge>
      </div>

      {/* Timer */}
      <div className="p-6 text-center">
        <div className="relative w-36 h-36 mx-auto mb-3">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="72" cy="72" r="68" stroke="var(--muted)" strokeWidth="8" fill="none" />
            <circle
              cx="72" cy="72" r="68"
              stroke={config.mode === 'agent' ? 'var(--accent)' : 'var(--primary)'}
              strokeWidth="8" fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
              <div className="text-xs text-muted-foreground">restant</div>
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Session {session.sessionIndex || 1}/{session.sessionsTotal || 1} — {config.sessionDurationMin} min
        </p>
      </div>

      {/* Near-limit alert */}
      {nearLimitComments && (
        <div className="px-4">
          <Alert
            variant="warning"
            message={`Vous approchez de la limite de commentaires (${session.dailyComments}/50)`}
          />
        </div>
      )}

      {/* Checklist / Agent status */}
      <div className="px-4 pt-3 flex-1 space-y-2 mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {config.mode === 'agent' ? 'Actions automatiques' : 'Actions suggérées'}
        </h3>
        <div className="space-y-2">
          <Card padding="sm" className="flex items-center gap-3">
            {session.likesThisSession >= session.targetLikes
              ? <CheckCircle2 className="w-5 h-5 text-success" />
              : <Circle className="w-5 h-5 text-muted-foreground" />}
            <span className="text-sm text-foreground flex-1">
              {config.mode === 'agent' ? 'Auto-likes' : 'Liker'} {session.targetLikes} posts
            </span>
            <span className="text-xs font-semibold text-primary">{session.likesThisSession}/{session.targetLikes}</span>
          </Card>
          <Card padding="sm" className="flex items-center gap-3">
            {session.commentsThisSession >= session.targetComments
              ? <CheckCircle2 className="w-5 h-5 text-success" />
              : <Circle className="w-5 h-5 text-muted-foreground" />}
            <span className="text-sm text-foreground flex-1">
              {config.mode === 'agent' ? 'Auto-commenter' : 'Commenter'} {session.targetComments} posts
            </span>
            <span className="text-xs font-semibold text-accent">{session.commentsThisSession}/{session.targetComments}</span>
          </Card>
        </div>
      </div>

      {/* Counters */}
      <div className="px-4 pb-4">
        <Card padding="sm" className="mb-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-bold text-primary">{session.likesThisSession}</div>
              <div className="text-xs text-muted-foreground">Likes</div>
            </div>
            <div>
              <div className="text-xl font-bold text-accent">{session.commentsThisSession}</div>
              <div className="text-xs text-muted-foreground">Comments</div>
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">{session.actionsDone}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </Card>

        {/* Buttons */}
        <div className="flex gap-2">
          {isIdle ? (
            <Button fullWidth onClick={() => startBot()}>
              <Play className="w-4 h-4" /> Démarrer
            </Button>
          ) : isRunning ? (
            <>
              <Button fullWidth onClick={() => pauseBot()}>
                <Pause className="w-4 h-4" /> Pause
              </Button>
              <Button fullWidth variant="secondary" onClick={() => stopBot()}>
                <Square className="w-4 h-4" /> Stop
              </Button>
            </>
          ) : isPaused ? (
            <>
              <Button fullWidth onClick={() => resumeBot()}>
                <Play className="w-4 h-4" /> Reprendre
              </Button>
              <Button fullWidth variant="secondary" onClick={() => stopBot()}>
                <Square className="w-4 h-4" /> Stop
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
