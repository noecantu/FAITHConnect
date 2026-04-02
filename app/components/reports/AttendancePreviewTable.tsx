'use client';

import { useState } from "react";
import { AttendanceRecord } from '@/app/hooks/useAttendanceForReports';
import { Member } from '@/app/lib/types';

interface Props {
  attendance: AttendanceRecord[];
  members: Member[];
}

const PAGE_SIZE = 20;

export function AttendancePreviewTable({ attendance }: Props) {
  const [page, setPage] = useState(0);

  if (!attendance || attendance.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No attendance records found.
      </p>
    );
  }

  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const visibleRows = attendance.slice(start, end);

  const totalPages = Math.ceil(attendance.length / PAGE_SIZE);

  const getName = (row: AttendanceRecord) => {
    if (row.visitorName) return row.visitorName;
    if (row.memberName) return row.memberName;
    return "Unknown";
  };

  const getType = (row: AttendanceRecord) => {
    if (row.visitorId) return "Visitor";
    return "Member";
  };

  return (
    <div className="space-y-2">
      <div className="overflow-auto border rounded-md bg-card">
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
                  {row.attended ? "Present" : "Absent"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Showing {start + 1}–{Math.min(end, attendance.length)} of {attendance.length} records
        </p>

        <div className="space-x-2">
          <button
            className="px-2 py-1 border rounded text-xs disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>

          <button
            className="px-2 py-1 border rounded text-xs disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
