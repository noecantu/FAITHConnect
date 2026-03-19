'use client';

import { AttendanceRecord } from '@/app/hooks/useAttendanceForReports';
import { Member } from '@/app/lib/types';

interface Props {
  attendance: AttendanceRecord[];
  members: Member[];
}

const MAX_PREVIEW_ROWS = 20;

export function AttendancePreviewTable({ attendance }: Props) {
  if (!attendance || attendance.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No attendance records found.
      </p>
    );
  }

  // Limit preview rows
  const visibleRows = attendance.slice(0, MAX_PREVIEW_ROWS);

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
    <div className="space-y-2">
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
          {visibleRows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="px-3 py-2">{row.date}</td>
              <td className="px-3 py-2">{getName(row)}</td>
              <td className="px-3 py-2">{getType(row)}</td>
              <td className="px-3 py-2">
                {row.attended ? 'Present' : 'Absent'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {attendance.length > MAX_PREVIEW_ROWS && (
        <p className="text-xs text-muted-foreground">
          Showing first {MAX_PREVIEW_ROWS} of {attendance.length} records
        </p>
      )}
    </div>
  );
}
