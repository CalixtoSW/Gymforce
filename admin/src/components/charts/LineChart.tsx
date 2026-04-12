'use client';

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type LineChartProps<T extends Record<string, number | string>> = {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  color?: string;
};

export function LineChart<T extends Record<string, number | string>>({
  data,
  xKey,
  yKey,
  color = '#6C63FF',
}: LineChartProps<T>) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <RechartsLineChart data={data}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <XAxis dataKey={xKey as string} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line dataKey={yKey as string} dot={{ r: 3 }} stroke={color} strokeWidth={2.5} />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
