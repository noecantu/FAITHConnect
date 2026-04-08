'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@/app/components/page-header';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useAttendanceHistory } from '@/app/hooks/useAttendanceHistory';
import { summarizeAttendance } from '@/app/lib/attendance-summary';
import { AttendanceChart } from '@/app/components/attendance/attendance-chart';
import { AttendanceStackedChart } from '@/app/components/attendance/attendance-stackedchart';
import { deleteAttendanceDay } from '@/app/lib/attendance';
import { useRouter } from "next/navigation";
import { Button } from '@/app/components/ui/button';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/app/components/ui/alert-dialog';
import { AlertDialogAction, AlertDialogCancel } from '@radix-ui/react-alert-dialog';
import { Trash } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/app/components/ui/select';

import { usePreviewPagination } from "@/app/hooks/usePreviewPagination";
import { PreviewPaginationFooter } from "@/app/components/layout/PreviewPaginationFooter";
import { useCan } from '@/app/hooks/useCan';
import { AttendanceSummaryItem } from '@/app/lib/types';
import { TableHead, TableHeader, TableRow } from '@/app/components/ui/table';

import { useAttendanceHistorySettings } from '@/app/hooks/useAttendanceHistorySettings';
import { useAuth } from '@/app/hooks/useAuth';
import { DashboardPage } from '../../layout/DashboardPage';

// --------------------------------------------------
// Helper: Summary Text (mirrors Contributions summary)
// --------------------------------------------------
function getAttendanceSummaryText(
  list: AttendanceSummaryItem[],
  timeFrame: "year" | "month" | "week",
  year: number | null,
  month: number | null,
  week: number | null
): string {
  if (!list.length) return "No attendance records";

  const total = list.reduce(
    (sum, s) => sum + s.membersPresent + s.visitorCount,
    0
  );

  if (timeFrame === "year" && year) {
    return `Showing ${year} — ${total} total attendees`;
  }

  if (timeFrame === "month" && month) {
    const monthName = new Date(0, Number(month) - 1).toLocaleString("default", {
      month: "long",
    });
    return `Showing ${monthName} ${year} — ${total} total attendees`;
  }

  if (timeFrame === "week" && week) {
    return `Showing Week ${week}, ${year} — ${total} total attendees`;
  }

  return `${total} total attendees`;
}

// --------------------------------------------------
// Page Component
// --------------------------------------------------
export default function AttendanceHistoryPage() {
  const router = useRouter();
  const { churchId } = useChurchId();
  const { user } = useAuth();

  const { data, loading, refresh } = useAttendanceHistory(churchId);
  const canView = useCan("attendance.read");
  const canDelete = useCan("attendance.manage");

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Summaries (one per date)
  const summary = summarizeAttendance(data);

  // ------------------------------
  // Persisted Breakdown Settings
  // ------------------------------
  const {
    breakdown: timeFrame,
    year: selectedYear,
    month: selectedMonth,
    week: selectedWeek,

    setBreakdownPersisted,
    setYearPersisted,
    setMonthPersisted,
    setWeekPersisted,
  } = useAttendanceHistorySettings(user);

  // ------------------------------
  // Available Years
  // ------------------------------
  const availableYears = useMemo(() => {
    return Array.from(
      new Set(summary.map(s => new Date(s.dateString).getFullYear()))
    ).sort((a, b) => b - a);
  }, [summary]);

  // ------------------------------
  // Available Months
  // ------------------------------
  const availableMonths = useMemo(() => {
    if (!selectedYear) return [];

    return Array.from(
      new Set(
        summary
          .filter(s => new Date(s.dateString).getFullYear() === Number(selectedYear))
          .map(s => new Date(s.dateString).getMonth() + 1)
      )
    ).sort((a, b) => a - b);
  }, [summary, selectedYear]);

  // ------------------------------
  // Available Weeks
  // ------------------------------
  const availableWeeks = useMemo(() => {
    if (!selectedYear) return [];

    const getWeek = (date: Date) => {
      const firstDay = new Date(date.getFullYear(), 0, 1);
      const diff = (date.getTime() - firstDay.getTime()) / 86400000;
      return Math.ceil((diff + firstDay.getDay() + 1) / 7);
    };

    return Array.from(
      new Set(
        summary
          .filter(s => new Date(s.dateString).getFullYear() === Number(selectedYear))
          .map(s => getWeek(new Date(s.dateString)))
      )
    ).sort((a, b) => a - b);
  }, [summary, selectedYear]);

  // ------------------------------
  // Filtered Attendance
  // ------------------------------
  const filteredAttendance = useMemo(() => {
    let list = [...summary];

    if (selectedYear) {
      list = list.filter(s =>
        new Date(s.dateString).getFullYear() === Number(selectedYear)
      );
    }

    if (timeFrame === "month" && selectedMonth) {
      list = list.filter(s =>
        new Date(s.dateString).getMonth() + 1 === Number(selectedMonth)
      );
    }

    if (timeFrame === "week" && selectedWeek) {
      const getWeek = (date: Date) => {
        const firstDay = new Date(date.getFullYear(), 0, 1);
        const diff = (date.getTime() - firstDay.getTime()) / 86400000;
        return Math.ceil((diff + firstDay.getDay() + 1) / 7);
      };
      list = list.filter(s => getWeek(new Date(s.dateString)) === selectedWeek);
    }

    return list;
  }, [summary, timeFrame, selectedYear, selectedMonth, selectedWeek]);

  // ------------------------------
  // Summary Text
  // ------------------------------
  const summaryText = getAttendanceSummaryText(
    filteredAttendance,
    timeFrame,
    selectedYear,
    selectedMonth,
    selectedWeek
  );

  // ------------------------------
  // Pagination
  // ------------------------------
  const {
    page,
    setPage,
    start,
    end,
    visible,
    totalPages,
    total,
  } = usePreviewPagination(filteredAttendance, 20);

  // ------------------------------
  // Conditional returns
  // ------------------------------
  if (loading) {
    return (
      <DashboardPage>
        <PageHeader title="Attendance History" />
        <p className="text-muted-foreground">Loading attendance history…</p>
      </DashboardPage>
    );
  }

  if (!canView) {
    return (
      <DashboardPage>
        <PageHeader title="Attendance History" />
        <p className="text-muted-foreground">You do not have permission to view attendance.</p>
      </DashboardPage>
    );
  }

  // ------------------------------
  // Theme
  // ------------------------------
  const darkTheme = createTheme({
    palette: { mode: 'dark' },
  });

  // --------------------------------------------------
  // Render
  // --------------------------------------------------
  return (
    <DashboardPage>
      <ThemeProvider theme={darkTheme}>
        <PageHeader
          title="Attendance History"
          subtitle={summaryText}
          className="mb-2"
        >
          <div className="flex flex-col gap-4">
          {/* Breakdown Controls */}
            <div className="flex flex-wrap justify-end items-center gap-4 mt-2 w-full">
              <span className="text-sm font-medium text-muted-foreground">
                Breakdown:
              </span>

              <RadioGroup
                value={timeFrame}
                onValueChange={(v) => setBreakdownPersisted(v as "year" | "month" | "week")}
                className="flex items-center gap-4"
              >
                <div className="flex items-center gap-1">
                  <RadioGroupItem value="year" id="tf-year" />
                  <label htmlFor="tf-year" className="text-sm text-muted-foreground">Year</label>
                </div>

                <div className="flex items-center gap-1">
                  <RadioGroupItem value="month" id="tf-month" />
                  <label htmlFor="tf-month" className="text-sm text-muted-foreground">Month</label>
                </div>

                <div className="flex items-center gap-1">
                  <RadioGroupItem value="week" id="tf-week" />
                  <label htmlFor="tf-week" className="text-sm text-muted-foreground">Week</label>
                </div>
              </RadioGroup>
            </div>

            {/* Dynamic Dropdowns */}
            <div className="flex flex-row justify-end items-center gap-4 w-full">

              {/* Year */}
              <Select
                value={selectedYear ? String(selectedYear) : ""}
                onValueChange={(v) => setYearPersisted(Number(v))}
              >
                <SelectTrigger
                  className="
                    h-9
                    flex-1 min-[360px]:flex-none min-[360px]:w-1/2 sm:w-[140px]
                    bg-black/40 border border-white/30 backdrop-blur-xl
                    text-white/80
                    hover:bg-white/5 hover:border-white/20
                    transition
                  "
                >
                  <SelectValue placeholder="Year" />
                </SelectTrigger>

                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Month */}
              {timeFrame === "month" && (
                <Select
                  value={selectedMonth ? String(selectedMonth) : ""}
                  onValueChange={(v) => setMonthPersisted(Number(v))}
                >
                  <SelectTrigger
                    className="
                      h-9
                      flex-1 min-[360px]:flex-none min-[360px]:w-1/2 sm:w-[140px]
                      bg-black/40 border border-white/30 backdrop-blur-xl
                      text-white/80
                      hover:bg-white/5 hover:border-white/20
                      transition
                    "
                  >
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>

                  <SelectContent>
                    {availableMonths.map(month => (
                      <SelectItem key={month} value={String(month)}>
                        {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Week */}
              {timeFrame === "week" && (
                <Select
                  value={selectedWeek ? String(selectedWeek) : ""}
                  onValueChange={(v) => setWeekPersisted(Number(v))}
                >
                  <SelectTrigger
                    className="
                      h-9
                      flex-1 min-[360px]:flex-none min-[360px]:w-1/2 sm:w-[140px]
                      bg-black/40 border border-white/30 backdrop-blur-xl
                      text-white/80
                      hover:bg-white/5 hover:border-white/20
                      transition
                    "
                  >
                    <SelectValue placeholder="Week" />
                  </SelectTrigger>

                  <SelectContent>
                    {availableWeeks.map(week => (
                      <SelectItem key={week} value={String(week)}>
                        Week {week}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

            </div>
          </div>
      </PageHeader>

      {/* CHART (matches Contributions layout) */}
      <Card className="relative bg-black/30 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Attendance Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          {timeFrame === "year" || timeFrame === "month" || timeFrame === "week" ? (
            <AttendanceChart data={filteredAttendance} />
          ) : (
            <AttendanceStackedChart data={filteredAttendance} />
          )}
        </CardContent>
      </Card>
      {/* TABLE */}
      <Card className="relative bg-black/30 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          <table className="w-full text-sm">
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="text-left py-2 px-2">Date</TableHead>
                <TableHead className="text-center py-2 px-2">Present</TableHead>
                <TableHead className="text-center py-2 px-2">Absent</TableHead>
                <TableHead className="text-center py-2 px-2">Visitors</TableHead>
                <TableHead className="text-center py-2 px-2">Action</TableHead>
              </TableRow>
            </TableHeader>

            <tbody>
              {visible.map((s) => (
                <tr
                  key={s.dateString}
                  className="border-b hover:bg-accent cursor-pointer"
                  onClick={() => router.push(`/attendance?date=${s.dateString}`)}
                >
                  <td className="py-2 px-2">{s.dateString}</td>
                  <td className="py-2 px-2 text-center">{s.membersPresent}</td>
                  <td className="py-2 px-2 text-center">{s.membersAbsent}</td>
                  <td className="py-2 px-2 text-center">{s.visitorCount}</td>

                  <td
                    className="py-2 px-2 text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 px-3 text-red-800 hover:text-red-600"
                          disabled={!canDelete}
                          onClick={() => canDelete && setDeleteTarget(s.dateString)}
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
                                if (!canDelete) return;
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
      </ThemeProvider>
    </DashboardPage>
  );
}
