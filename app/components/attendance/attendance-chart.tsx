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
import { AttendanceSummaryItem } from '../../lib/types';

export function AttendanceChart({ data }: { data: AttendanceSummaryItem[] }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dateString" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="present" stroke="#4ade80" strokeWidth={2} />
          <Line type="monotone" dataKey="absent" stroke="#f87171" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
