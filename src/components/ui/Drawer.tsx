import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from './Button';

type DrawerProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  widthClass?: string;
};

export function Drawer({ open, title, children, onClose, widthClass = 'max-w-xl' }: DrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 backdrop-blur-sm" onMouseDown={onClose}>
      <aside
        className={`h-full w-full ${widthClass} overflow-y-auto border-l border-slate-200 bg-white shadow-soft`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Закрыть">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </aside>
    </div>
  );
}
