import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked, onCheckedChange, label, description, disabled, className }, ref) => {
    return (
      <label className={cn('inline-flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}>
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => !disabled && onCheckedChange(!checked)}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            checked ? 'bg-primary' : 'bg-muted'
          )}
        >
          <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm', checked ? 'translate-x-6' : 'translate-x-1')} />
        </button>
        {(label || description) && (
          <div>
            {label && <span className="text-sm font-medium text-foreground block">{label}</span>}
            {description && <span className="text-xs text-foreground-muted block">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);

Toggle.displayName = 'Toggle';
