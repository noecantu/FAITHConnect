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

          <Tooltip contentStyle={{ backgroundColor: 'white', color: 'black' }} />

          {/* Members Present */}
          <Line
            type="monotone"
            dataKey="membersPresent"
            stroke="#4ade80"
            strokeWidth={2}
          />

          {/* Members Absent */}
          <Line
            type="monotone"
            dataKey="membersAbsent"
            stroke="#f87171"
            strokeWidth={2}
          />

          {/* Optional: Visitors */}
          
          <Line
            type="monotone"
            dataKey="visitorCount"
            stroke="#60a5fa"
            strokeWidth={2}
          />
         
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
