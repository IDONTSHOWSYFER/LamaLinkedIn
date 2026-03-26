import { useStore } from '../store';
import { cn } from '@/lib/utils';
import { Shield, Bot } from 'lucide-react';

export function ModeToggle() {
  const { config, toggleMode, session } = useStore();
  const isRunning = session.botState === 'running' || session.botState === 'paused';

  return (
    <div className="flex items-center bg-muted rounded-full p-0.5">
      <button
        onClick={() => toggleMode('assist')}
        disabled={isRunning}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
          config.mode === 'assist'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Shield className="w-3 h-3" />
        Assisté
      </button>
      <button
        onClick={() => toggleMode('agent')}
        disabled={isRunning}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
          config.mode === 'agent'
            ? 'bg-accent text-accent-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Bot className="w-3 h-3" />
        Agent
      </button>
    </div>
  );
}
