import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-neutral-900 dark:focus:ring-offset-neutral-900 light:focus:ring-offset-white disabled:opacity-50 disabled:pointer-events-none rounded-lg cursor-pointer";
    const variants = {
      primary: "bg-primary text-white dark:text-white light:text-white hover:bg-primary-dark",
      secondary: "bg-accent text-neutral-900 hover:bg-accent-2 hover:text-adaptive",
      outline: "border border-adaptive hover:bg-white/10 dark:hover:bg-white/10 light:hover:bg-black/10 text-adaptive",
      glass: "bg-white/10 dark:bg-white/10 light:bg-black/10 backdrop-blur-sm border border-adaptive text-adaptive hover:bg-white/20 dark:hover:bg-white/20 light:hover:bg-black/20"
    };
    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg"
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
