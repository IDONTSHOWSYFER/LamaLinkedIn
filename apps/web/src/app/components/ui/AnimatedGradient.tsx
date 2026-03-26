import { ReactNode } from 'react';

interface AnimatedGradientProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedGradient({ children, className = '' }: AnimatedGradientProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-20 dark:opacity-20 animate-gradient bg-[length:200%_200%]" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
