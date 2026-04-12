import type { ReactNode } from 'react';

type PageTitleProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageTitle({ title, subtitle, actions }: PageTitleProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-gray-600">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}
