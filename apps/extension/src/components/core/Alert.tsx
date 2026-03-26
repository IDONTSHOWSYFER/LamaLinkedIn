import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertProps {
  variant?: 'success' | 'warning' | 'danger' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function Alert({ variant = 'info', title, message, onClose, className }: AlertProps) {
  const variants = {
    success: { container: 'bg-success/10 border-success/20 text-success', icon: CheckCircle2 },
    warning: { container: 'bg-warning/10 border-warning/20 text-warning', icon: AlertTriangle },
    danger: { container: 'bg-danger/10 border-danger/20 text-danger', icon: AlertCircle },
    info: { container: 'bg-primary/10 border-primary/20 text-primary', icon: Info },
  };
  const { container, icon: Icon } = variants[variant];
  return (
    <div className={cn('rounded-xl p-3 border', container, className)}>
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && <div className="font-semibold text-sm mb-0.5">{title}</div>}
          <div className="text-xs opacity-90">{message}</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="flex-shrink-0 p-1 hover:bg-black/10 rounded-md transition-colors">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
