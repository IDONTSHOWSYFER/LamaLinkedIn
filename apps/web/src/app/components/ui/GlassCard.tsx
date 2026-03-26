import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("glass-card overflow-hidden", className)}
        {...props}
      />
    );
  }
);
GlassCard.displayName = 'GlassCard';
