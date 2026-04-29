import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

import type { ToastMessage } from '../../types';
import { Button } from './Button';

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  info: 'border-blue-200 bg-blue-50 text-blue-700',
};

type ToastProps = {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
};

export function ToastStack({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-[360px] max-w-[calc(100vw-40px)] flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div key={toast.id} className={`pointer-events-auto rounded-2xl border p-4 shadow-soft ${styles[toast.type]}`}>
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{toast.title}</div>
                {toast.description ? <p className="mt-1 text-sm opacity-80">{toast.description}</p> : null}
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onDismiss(toast.id)} aria-label="Закрыть уведомление">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
