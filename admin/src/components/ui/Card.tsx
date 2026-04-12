import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={clsx('rounded-xl border border-gray-200 bg-white p-4 shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}
