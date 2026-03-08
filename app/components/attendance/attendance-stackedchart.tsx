'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { AttendanceSummaryItem } from '@/app/lib/types';
import { format } from 'date-fns';

export function AttendanceStackedChart({ data }: { data: AttendanceSummaryItem[] }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="dateString"
            tickFormatter={(value) => {
                const [year, month, day] = value.split('-').map(Number);
                return format(new Date(year, month - 1, day), 'MM-dd-yy');
            }}
            angle={-45}
            textAnchor="end"
            tick={{ fill: '#6b7280' }}
            tickMargin={12}
          />

          <YAxis tick={{ fill: '#6b7280' }} />

          <Tooltip
            contentStyle={{ backgroundColor: 'white', color: 'black' }}
            cursor={{ fill: 'transparent' }}
        />

            <Bar
            dataKey="membersPresent"
            stackId="a"
            fill="hsl(var(--chart-1))"
            />

            <Bar
            dataKey="visitorCount"
            stackId="a"
            fill="hsl(var(--chart-3))"
            />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
