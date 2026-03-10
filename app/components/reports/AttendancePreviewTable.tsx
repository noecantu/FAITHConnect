'use client';

import { AttendanceRecord } from '@/app/hooks/useAttendanceForReports';
import { Member } from '@/app/lib/types';

interface Props {
  attendance: AttendanceRecord[];
  members: Member[];
}

export function AttendancePreviewTable({ attendance }: Props) {
  const getName = (row: AttendanceRecord) => {
  if (row.visitorName) return row.visitorName;
  if (row.memberName) return row.memberName;
  return "Unknown";
};

  const getType = (row: AttendanceRecord) => {
    if (row.visitorId) return 'Visitor';
    return 'Member';
  };

  return (
    <table className="w-full text-sm">
      <thead className="bg-muted">
        <tr>
          <th className="text-left px-3 py-2">Date</th>
          <th className="text-left px-3 py-2">Name</th>
          <th className="text-left px-3 py-2">Type</th>
          <th className="text-left px-3 py-2">Status</th>
        </tr>
      </thead>

      <tbody>
        {attendance.map((row) => (
          <tr key={row.id} className="border-b last:border-0">
            <td className="px-3 py-2">{row.date}</td>
            <td className="px-3 py-2">{getName(row)}</td>
            <td className="px-3 py-2">{getType(row)}</td>
            <td className="px-3 py-2">
              {row.attended ? 'Present' : 'Absent'}
            </td>
          </tr>
        ))}

        {attendance.length === 0 && (
          <tr>
            <td
              colSpan={4}
              className="px-3 py-6 text-center text-muted-foreground"
            >
              No attendance records found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
