import type { ReactNode } from 'react';

const variants = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};

type BadgeProps = {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
};

export function Badge({ children, variant = 'slate', className = '' }: BadgeProps) {
  return <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ${variants[variant]} ${className}`}>{children}</span>;
}
