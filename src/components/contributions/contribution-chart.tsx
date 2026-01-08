'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { Contribution } from '@/lib/types';

interface ContributionChartProps {
  data: Contribution[];
}

export function ContributionChart({ data }: ContributionChartProps) {
  const chartData = React.useMemo(() => {
    const categories = ['Tithes', 'Offering', 'Donation', 'Other'];
    const summary = categories.map((category) => ({
      name: category,
      total: data
        .filter((c) => c.category === category)
        .reduce((acc, curr) => acc + curr.amount, 0),
    }));
    return summary;
  }, [data]);

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
             contentStyle={{
                background: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
             }}
          />
          <Bar dataKey="total" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
