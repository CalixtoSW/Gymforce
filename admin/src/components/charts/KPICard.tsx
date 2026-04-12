import type { ReactNode } from 'react';

import { Card } from '@/components/ui/Card';

type KPICardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
};

export function KPICard({ title, value, icon, color = '#6C63FF' }: KPICardProps) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-gray-500">{icon}</div>
      </div>
    </Card>
  );
}
