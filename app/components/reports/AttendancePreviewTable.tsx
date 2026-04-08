'use client';

import { useState } from "react";
import { AttendanceRecord } from '@/app/hooks/useAttendanceForReports';
import { Member } from '@/app/lib/types';
import { PreviewPaginationFooter } from "../layout/PreviewPaginationFooter";
import { ReportContainer } from "../reports/ReportContainer";

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
    <ReportContainer
      footer={
        <PreviewPaginationFooter
          start={start}
          end={end}
          total={attendance.length}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          label="records"
        />
      }
    >
      <div className="w-full overflow-x-auto rounded-md border border-white/20 bg-black/50 backdrop-blur-xl">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-slate-800 border-b border-white/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-white/80">Date</th>
              <th className="text-left px-4 py-3 font-medium text-white/80">Name</th>
              <th className="text-left px-4 py-3 font-medium text-white/80">Type</th>
              <th className="text-left px-4 py-3 font-medium text-white/80">Status</th>
            </tr>
          </thead>

          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-white/20 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3 text-white/90">{row.date}</td>
                <td className="px-4 py-3 text-white/90">{getName(row)}</td>
                <td className="px-4 py-3 text-white/90">{getType(row)}</td>
                <td className="px-4 py-3 text-white/90">
                  {row.attended ? "Present" : "Absent"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ReportContainer>
  );
}
