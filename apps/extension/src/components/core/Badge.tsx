import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'free' | 'premium' | 'success' | 'warning' | 'danger' | 'neutral' | 'assist' | 'agent';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  const variants = {
    free: 'bg-muted text-muted-foreground',
    premium: 'bg-accent text-accent-foreground',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-danger/15 text-danger',
    neutral: 'glass text-foreground border-border-glass',
    assist: 'bg-primary/15 text-primary',
    agent: 'bg-accent/15 text-accent-foreground',
  };
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
