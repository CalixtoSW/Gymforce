'use client';

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type BarChartProps<T extends Record<string, number | string>> = {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  color?: string;
};

export function BarChart<T extends Record<string, number | string>>({
  data,
  xKey,
  yKey,
  color = '#6C63FF',
}: BarChartProps<T>) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <RechartsBarChart data={data}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <XAxis dataKey={xKey as string} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey={yKey as string} fill={color} radius={[6, 6, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
