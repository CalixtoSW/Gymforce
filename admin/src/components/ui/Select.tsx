import { clsx } from 'clsx';
import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ label, className, id, children, ...props }: SelectProps) {
  return (
    <label className="flex w-full flex-col gap-1" htmlFor={id}>
      {label ? <span className="text-sm font-medium text-gray-700">{label}</span> : null}
      <select
        className={clsx(
          'h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
          className,
        )}
        id={id}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
