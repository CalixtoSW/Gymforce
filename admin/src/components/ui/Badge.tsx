import { clsx } from 'clsx';
import type { ReactNode } from 'react';

type BadgeTone = 'default' | 'success' | 'danger' | 'warning' | 'muted' | 'tier';

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

export function Badge({ children, tone = 'default', className }: BadgeProps) {
  const byTone: Record<BadgeTone, string> = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800',
    warning: 'bg-amber-100 text-amber-800',
    muted: 'bg-gray-200 text-gray-700',
    tier: 'bg-brand-100 text-brand-700',
  };

  return (
    <span
      className={clsx(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
        byTone[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
