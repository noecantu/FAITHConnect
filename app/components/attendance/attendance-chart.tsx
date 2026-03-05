'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { AttendanceSummaryItem } from '@/app/lib/types';
import { format } from 'date-fns';

export function AttendanceChart({ data }: { data: AttendanceSummaryItem[] }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="dateString"
            tickFormatter={(value) => format(new Date(value), 'MM-dd-yy')}
            angle={-45}
            textAnchor="end"
            tick={{ fill: '#6b7280' }}
            tickMargin={12}
          />
          <YAxis tick={{ fill: '#6b7280' }} />
          <Tooltip contentStyle={{ backgroundColor: 'white', color: 'black' }} />
          <Line type="monotone" dataKey="present" stroke="#4ade80" strokeWidth={2} />
          <Line type="monotone" dataKey="absent" stroke="#f87171" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
