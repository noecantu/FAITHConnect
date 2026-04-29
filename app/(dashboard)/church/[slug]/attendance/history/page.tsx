'use client';

import { useState, useMemo } from 'react';
import { useChurchId } from '@/app/hooks/useChurchId';
import { CalendarDays, BarChart2 } from 'lucide-react';
import { cn } from '@/app/lib/utils';
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
import { Separator } from '@/app/components/ui/separator';

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
  const { churchId, loading: churchLoading } = useChurchId();
  const { loading: authLoading } = useAuth();

  const { data, loading, refresh } = useAttendanceHistory(churchId ?? undefined);
  const canView = useCan("attendance.read");
  const canDelete = useCan("attendance.manage");

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState("date-desc");

  // Summaries (one per date)
  const summary = summarizeAttendance(data);

  // ------------------------------
  // Persisted Breakdown Settings
  // ------------------------------
  const {
    settings: attendanceHistorySettings,
    updateSettings: updateAttendanceHistorySettings,
  } = useAttendanceHistorySettings(churchId ?? undefined);

  const timeFrame = (attendanceHistorySettings?.breakdown ?? "year") as "year" | "month" | "week";
  const selectedYear = (attendanceHistorySettings?.year ?? null) as number | null;
  const selectedMonth = (attendanceHistorySettings?.month ?? null) as number | null;
  const selectedWeek = (attendanceHistorySettings?.week ?? null) as number | null;

  const setBreakdownPersisted = (value: "year" | "month" | "week") =>
    updateAttendanceHistorySettings({
      ...(attendanceHistorySettings ?? {}),
      breakdown: value,
    });

  const setYearPersisted = (value: number) =>
    updateAttendanceHistorySettings({
      ...(attendanceHistorySettings ?? {}),
      year: value,
    });

  const setMonthPersisted = (value: number) =>
    updateAttendanceHistorySettings({
      ...(attendanceHistorySettings ?? {}),
      month: value,
    });

  const setWeekPersisted = (value: number) =>
    updateAttendanceHistorySettings({
      ...(attendanceHistorySettings ?? {}),
      week: value,
    });

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

    const sorted = useMemo(() => {
      const arr = [...visible];

      switch (sortKey) {
        case "date-asc":
          return arr.sort((a, b) => a.dateString.localeCompare(b.dateString));

        case "date-desc":
          return arr.sort((a, b) => b.dateString.localeCompare(a.dateString));

        case "present":
          return arr.sort((a, b) => b.membersPresent - a.membersPresent);

        case "absent":
          return arr.sort((a, b) => b.membersAbsent - a.membersAbsent);

        case "visitors":
          return arr.sort((a, b) => b.visitorCount - a.visitorCount);

        default:
          return arr;
      }
    }, [visible, sortKey]);
    
  // ------------------------------
  // Conditional returns
  // ------------------------------
  if (authLoading || churchLoading || loading) {
    return (
      <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-black/90 via-black/75 to-black/60 backdrop-blur-xl p-8 text-center">
        <p className="text-white/40">Loading attendance history…</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-black/90 via-black/75 to-black/60 backdrop-blur-xl p-8 text-center">
        <p className="text-white/40">You do not have permission to view attendance.</p>
      </div>
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
    <>
      <ThemeProvider theme={darkTheme}>
        {/* ── HERO CARD ── */}
          <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-black/90 via-black/75 to-black/60 backdrop-blur-xl shadow-2xl mb-6">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(ellipse at 60% 0%, rgba(255,255,255,0.06) 0%, transparent 70%)" }}
            />
            <div className="relative p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="rounded-full border border-white/20 bg-white/[0.07] px-2.5 py-0.5 text-xs text-white/50 font-semibold">
                      History
                    </span>
                    {filteredAttendance.length > 0 && (
                      <span className="rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-0.5 text-xs text-white/40">
                        {filteredAttendance.length} records
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1.5">
                    Attendance History
                  </h1>
                  <div className="flex items-center gap-1.5 text-white/50 text-sm">
                    <CalendarDays size={14} />
                    <span>{summaryText}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-3 shrink-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-medium text-white/40">Breakdown:</span>
                    <RadioGroup
                      value={timeFrame}
                      onValueChange={(v) => setBreakdownPersisted(v as "year" | "month" | "week")}
                      className="flex items-center gap-3"
                    >
                      {(["year", "month", "week"] as const).map((tf) => (
                        <div key={tf} className="flex items-center gap-1.5">
                          <RadioGroupItem value={tf} id={`tf-${tf}`} />
                          <label htmlFor={`tf-${tf}`} className="text-xs text-white/60 capitalize cursor-pointer">{tf}</label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={selectedYear ? String(selectedYear) : ""} onValueChange={(v) => setYearPersisted(Number(v))}>
                      <SelectTrigger className="h-8 w-[110px] bg-black/60 border border-white/20 text-white/80 text-xs hover:bg-white/5 transition">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {timeFrame === "month" && (
                      <Select value={selectedMonth ? String(selectedMonth) : ""} onValueChange={(v) => setMonthPersisted(Number(v))}>
                        <SelectTrigger className="h-8 w-[120px] bg-black/60 border border-white/20 text-white/80 text-xs hover:bg-white/5 transition">
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMonths.map((month) => (
                            <SelectItem key={month} value={String(month)}>
                              {new Date(0, month - 1).toLocaleString("default", { month: "long" })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {timeFrame === "week" && (
                      <Select value={selectedWeek ? String(selectedWeek) : ""} onValueChange={(v) => setWeekPersisted(Number(v))}>
                        <SelectTrigger className="h-8 w-[110px] bg-black/60 border border-white/20 text-white/80 text-xs hover:bg-white/5 transition">
                          <SelectValue placeholder="Week" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableWeeks.map((week) => (
                            <SelectItem key={week} value={String(week)}>Week {week}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
      <Card className="relative bg-black/60 border-white/15 backdrop-blur-xl mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <BarChart2 size={15} className="text-white/40" />
            <CardTitle className="text-base font-semibold text-white/80">Attendance Overview</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          {timeFrame === "year" || timeFrame === "month" || timeFrame === "week" ? (
            <AttendanceChart data={filteredAttendance} />
          ) : (
            <AttendanceStackedChart data={filteredAttendance} />
          )}
        </CardContent>
      </Card>

      {/* CARD WRAPPER */}
      <Card className="relative bg-black/60 border-white/15 backdrop-blur-xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold text-white/80">Attendance Records</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Sort:</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="bg-black/50 text-white/70 text-xs border border-white/20 rounded-md px-2 py-1 hover:border-white/40 focus:outline-none focus:ring-1 focus:ring-white/30"
            >
              <option value="date-desc">Date ↓</option>
              <option value="date-asc">Date ↑</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="visitors">Visitors</option>
            </select>
          </div>
        </CardHeader>

        <Separator className="opacity-20" />

        <CardContent className="space-y-4 pt-4">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[600px] text-sm">
              <TableHeader>
                <TableRow className="border-b border-white/10">
                  <TableHead className="text-left py-2 px-3 text-xs text-white/40 font-semibold tracking-wide uppercase">Date</TableHead>
                  <TableHead className="text-center py-2 px-3 text-xs text-white/40 font-semibold tracking-wide uppercase">Present</TableHead>
                  <TableHead className="text-center py-2 px-3 text-xs text-white/40 font-semibold tracking-wide uppercase">Absent</TableHead>
                  <TableHead className="text-center py-2 px-3 text-xs text-white/40 font-semibold tracking-wide uppercase">Guests</TableHead>
                  <TableHead className="text-center py-2 px-3 text-xs text-white/40 font-semibold tracking-wide uppercase">Action</TableHead>
                </TableRow>
              </TableHeader>
              <tbody>
                {sorted.map((s) => (
                  <tr
                    key={s.dateString}
                    className="border-b border-white/[0.06] transition-colors hover:bg-white/[0.04] cursor-pointer"
                    onClick={() => router.push(`/church/${churchId}/attendance?date=${s.dateString}`)}
                  >
                    <td className="py-2.5 px-3 text-white/75 font-medium">{s.dateString}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">{s.membersPresent}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="rounded-full border border-red-500/15 bg-red-500/10 px-2 py-0.5 text-xs text-red-400/70">{s.membersAbsent}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-xs text-sky-400">{s.visitorCount}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
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

                        <AlertDialogContent className="bg-white/10 backdrop-blur-sm border border-white/20">
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
          </div>

          {/* PAGINATION */}
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
    </>
  );
}
