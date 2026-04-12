import { clsx } from 'clsx';
import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export function Input({ label, hint, error, className, id, ...props }: InputProps) {
  return (
    <label className="flex w-full flex-col gap-1" htmlFor={id}>
      {label ? <span className="text-sm font-medium text-gray-700">{label}</span> : null}
      <input
        className={clsx(
          'h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
          error && 'border-red-500 focus:ring-red-100',
          className,
        )}
        id={id}
        {...props}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
    </label>
  );
}
