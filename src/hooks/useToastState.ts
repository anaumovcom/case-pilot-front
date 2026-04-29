import { useCallback, useState } from 'react';

import type { ToastMessage } from '../types';

export function useToastState() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((title: string, description?: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, title, description, type }]);
    window.setTimeout(() => dismissToast(id), 4200);
  }, [dismissToast]);

  return { toasts, showToast, dismissToast };
}
