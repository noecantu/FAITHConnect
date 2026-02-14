'use client';

import { useState } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useAttendanceHistory } from '@/app/hooks/useAttendanceHistory';
import { summarizeAttendance } from '@/app/lib/attendance-summary';
import { AttendanceChart } from '@/app/components/attendance/attendance-chart';
import { deleteAttendanceDay } from '@/app/lib/attendance';
import { Button } from '@/app/components/ui/button';
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/app/components/ui/alert-dialog';

import { Trash } from 'lucide-react';
import { useAttendanceFilters } from '@/app/hooks/useAttendanceFilters';
import { AttendanceHistoryControls } from '@/app/components/attendance/AttendanceHistoryControls';

// --------------------------------------------------
// Page Component
// --------------------------------------------------
export default function AttendanceHistoryPage() {
  const churchId = useChurchId();
  const { data, loading, refresh } = useAttendanceHistory(churchId);
  const router = useRouter();

  // Summaries (one per date)
  const summary = summarizeAttendance(data);

  // MUST be above any conditional return
  const filters = useAttendanceFilters(summary);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Attendance History" />
        <p className="text-muted-foreground">Loading attendance history…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Attendance History" />

      {/* ⭐ Controls identical to Calendar List View */}
      <AttendanceHistoryControls filters={filters} />

      {/* CHART */}
      <AttendanceChart data={summary} />

      {/* TABLE */}
      <div className="space-y-2">
        {filters.filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Present</th>
                <th className="text-left py-2 px-2">Absent</th>
                <th className="text-left py-2 px-2">Percent</th>
                <th className="text-left py-2 px-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {filters.filtered.map((s) => (
                <tr
                  key={s.dateString}
                  className="border-b hover:bg-accent cursor-pointer"
                  onClick={() => router.push(`/attendance?date=${s.dateString}`)}
                >
                  <td className="py-2 px-2">{s.dateString}</td>
                  <td className="py-2 px-2">{s.present}</td>
                  <td className="py-2 px-2">{s.absent}</td>
                  <td className="py-2 px-2">
                    {Math.round(s.percentage * 100)}%
                  </td>

                  <td
                    className="py-2 px-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="h-8 px-3 border-white/20 text-white/80 hover:text-white hover:bg-white/10"
                          onClick={() => setDeleteTarget(s.dateString)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>

                      <AlertDialogContent className="bg-white/10 backdrop-blur-sm border border-white/10">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete attendance for {deleteTarget}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove all attendance records for this date.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>

                          <AlertDialogAction
                            onClick={async () => {
                              if (!deleteTarget || !churchId) return;
                              await deleteAttendanceDay(churchId, deleteTarget);
                              setDeleteTarget(null);
                              refresh();
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
