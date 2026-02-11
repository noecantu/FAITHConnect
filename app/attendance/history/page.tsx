'use client';

import { useState } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useAttendanceHistory } from '@/app/hooks/useAttendanceHistory';
import { summarizeAttendance } from '@/app/lib/attendance-summary';
import { AttendanceChart } from '@/app/components/attendance/attendance-chart';
import { deleteAttendanceDay } from '@/app/lib/attendance';
import { Button } from '@/app/components/ui/button';

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

export default function AttendanceHistoryPage() {
  const churchId = useChurchId();
  const { data, loading, refresh } = useAttendanceHistory(churchId);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Attendance History" />
        <p className="text-muted-foreground">Loading attendance history…</p>
      </div>
    );
  }

  const summary = summarizeAttendance(data);

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Attendance History" />

      <AttendanceChart data={summary} />

      <div className="space-y-2">
        {summary.map((s) => (
          <div
            key={s.dateString}
            className="flex items-center justify-between border-b py-2"
          >
            <div className="flex gap-6">
              <span>{s.dateString}</span>
              <span>{s.present} present</span>
              <span>{s.absent} absent</span>
              <span>{Math.round(s.percentage * 100)}%</span>
            </div>

            {/* Delete Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 px-3 border-white/20 text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => setDeleteTarget(s.dateString)}
                >
                  Delete
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
          </div>
        ))}
      </div>
    </div>
  );
}
