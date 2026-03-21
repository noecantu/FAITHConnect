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
} from '@/app/components/ui/alert-dialog';

import { Trash } from 'lucide-react';
import { useAttendanceFilters } from '@/app/hooks/useAttendanceFilters';
import { AttendanceHistoryControls } from '@/app/components/attendance/AttendanceHistoryControls';
import { AlertDialogAction, AlertDialogCancel } from '@radix-ui/react-alert-dialog';
import { AttendanceStackedChart } from '@/app/components/attendance/attendance-stackedchart';
import { usePreviewPagination } from "@/app/hooks/usePreviewPagination";
import { PreviewPaginationFooter } from "@/app/components/layout/PreviewPaginationFooter";
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { cn } from '@/app/lib/utils';
import { Label } from "@/app/components/ui/label";

// --------------------------------------------------
// Page Component
// --------------------------------------------------
export default function AttendanceHistoryPage() {
  const { churchId } = useChurchId();
  const { data, loading, refresh } = useAttendanceHistory(churchId);
  const router = useRouter();
  const [chartMode, setChartMode] = useState<"line" | "stacked">("line");

  // Summaries (one per date)
  const summary = summarizeAttendance(data);

  // MUST be above any conditional return
  const filters = useAttendanceFilters(summary);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const {
    page,
    setPage,
    start,
    end,
    visible,
    totalPages,
    total,
  } = usePreviewPagination(filters.filtered, 20);

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
      <PageHeader title="Attendance History">
        <div className="flex items-center gap-4">
          <RadioGroup
            value={chartMode}
            onValueChange={(v) => setChartMode(v as "line" | "stacked")}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-1">
              <RadioGroupItem value="line" id="chart-line" />
              <label htmlFor="chart-line" className="text-sm">Line Chart</label>
            </div>

            <div className="flex items-center gap-1">
              <RadioGroupItem value="stacked" id="chart-stacked" />
              <label htmlFor="chart-stacked" className="text-sm">Stacked Bar</label>
            </div>
          </RadioGroup>
        </div>
      </PageHeader>

      {/* ⭐ Controls identical to Calendar List View */}
      <AttendanceHistoryControls filters={filters} />

      {/* CHART */}
      {chartMode === "line" ? (
        <AttendanceChart data={summary} />
      ) : (
        <AttendanceStackedChart data={summary} />
      )}

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Members Present</th>
                <th className="text-left py-2 px-2">Members Absent</th>
                <th className="text-left py-2 px-2">Visitors</th>
                <th className="text-left py-2 px-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {visible.map((s) => (
                <tr
                  key={s.dateString}
                  className="border-b hover:bg-accent cursor-pointer"
                  onClick={() => router.push(`/attendance?date=${s.dateString}`)}
                >
                  <td className="py-2 px-2">{s.dateString}</td>
                  <td className="py-2 px-2">{s.membersPresent}</td>
                  <td className="py-2 px-2">{s.membersAbsent}</td>
                  <td className="py-2 px-2">{s.visitorCount}</td>

                  <td
                    className="py-2 px-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* delete dialog */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 px-3 text-red-800 hover:text-red-600"
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
                          <AlertDialogCancel asChild>
                            <Button variant="outline" className="w-full">
                              Cancel
                            </Button>
                          </AlertDialogCancel>

                          <AlertDialogAction asChild>
                            <Button
                              variant="destructive"
                              className="w-full"
                              onClick={async () => {
                                if (!deleteTarget || !churchId) return;
                                await deleteAttendanceDay(churchId, deleteTarget);
                                setDeleteTarget(null);
                                refresh();
                              }}
                            >
                              Delete
                            </Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <PreviewPaginationFooter
            start={start}
            end={end}
            total={total}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            label="records"
          />
        </CardContent>
      </Card>

    </div>
  );
}
