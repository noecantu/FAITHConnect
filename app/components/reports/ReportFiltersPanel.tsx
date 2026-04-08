'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";

import { Button } from "@/app/components/ui/button";

import { ReportTypeSelect } from "./ReportTypeSelect";
import { MemberSelect } from "./MemberSelect";
import { MemberFieldSelect } from "./MemberFieldSelect";
import { StatusSelect } from "./StatusSelect";

import { statusOptions, memberFieldOptions } from "@/app/lib/constants/reportOptions";

interface ReportFiltersPanelProps {
  reportType: "members" | "contributions" | "attendance";
  setReportType: (v: any) => void;

  members: any[];
  selectedMembers: string[];
  setSelectedMembers: (v: string[]) => void;

  selectedStatus: string[];
  setSelectedStatus: (v: string[]) => void;

  selectedFields: string[];
  setSelectedFields: (v: string[]) => void;

  includeVisitors: boolean;
  setIncludeVisitors: (v: boolean) => void;

  timeFrame: "week" | "month" | "year";
  setTimeFrame: (v: "week" | "month" | "year") => void;

  selectedYear: string | null;
  setSelectedYear: (v: string | null) => void;

  selectedMonth: string | null;
  setSelectedMonth: (v: string | null) => void;

  selectedWeek: number | null;
  setSelectedWeek: (v: number | null) => void;

  availableYears: string[];
  availableMonths: string[];
  availableWeeks: number[];

  canReadMembers: boolean;
  canReadContributions: boolean;
  canReadAttendance: boolean;
}

export function ReportFiltersPanel({
  reportType,
  setReportType,

  members,
  selectedMembers,
  setSelectedMembers,

  selectedStatus,
  setSelectedStatus,

  selectedFields,
  setSelectedFields,

  includeVisitors,
  setIncludeVisitors,

  timeFrame,
  setTimeFrame,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedWeek,
  setSelectedWeek,
  availableYears,
  availableMonths,
  availableWeeks,
  canReadMembers,
  canReadContributions,
  canReadAttendance,
}: ReportFiltersPanelProps) {
  return (
    // <Card className="w-full lg:w-80 h-fit">
    <Card className="relative w-full lg:w-80 h-fit bg-black/30 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* REPORT TYPE */}
        <ReportTypeSelect
          value={reportType}
          onChange={setReportType}
          canReadMembers={canReadMembers}
          canReadContributions={canReadContributions}
          canReadAttendance={canReadAttendance}
        />

        {/* MEMBER SELECT */}
        <MemberSelect
          members={members}
          value={selectedMembers}
          onChange={setSelectedMembers}
        />

        {/* STATUS (Members Report Only) */}
        {reportType === "members" && (
          <StatusSelect
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
        )}

        {/* MEMBER FIELD SELECT (Members Report Only) */}
        {reportType === "members" && (
          <MemberFieldSelect
            options={memberFieldOptions}
            value={selectedFields}
            onChange={setSelectedFields}
          />
        )}

        {/* INCLUDE VISITORS (Attendance Only) */}
        {reportType === "attendance" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Include Visitors</label>
            <select
              className="
                w-full
                h-10
                rounded-md
                border border-white/20
                bg-black/20
                text-white text-sm
                px-3
                focus:outline-none
                focus:ring-2
                focus:ring-white/30
              "
              value={includeVisitors ? "yes" : "no"}
              onChange={(e) => setIncludeVisitors(e.target.value === "yes")}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        )}

        {/* ----------------------------- */}
        {/* GUIDED TIME-FRAME SELECTORS   */}
        {/* ----------------------------- */}

        {(reportType === "contributions" || reportType === "attendance") && (
          <>
            {/* TIME FRAME */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Frame</label>
              <div className="flex gap-2">
                {["week", "month", "year"].map((tf) => {
                  const isActive = timeFrame === tf;

                  return (
                    <Button
                      key={tf}
                      variant={isActive ? "default" : "outline"}
                      className={
                        isActive
                          ? "" // let default variant use your theme's default button style
                          : "bg-black/30 border border-white/20 backdrop-blur-xl"
                      }
                      onClick={() => {
                        setTimeFrame(tf as any);
                        setSelectedYear(null);
                        setSelectedMonth(null);
                        setSelectedWeek(null);
                      }}
                    >
                      {tf.charAt(0).toUpperCase() + tf.slice(1)}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* YEAR SELECT */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <select
                className="
                  w-full
                  h-10
                  rounded-md
                  border border-white/20
                  bg-black/20
                  text-white text-sm
                  px-3
                  focus:outline-none
                  focus:ring-2
                  focus:ring-white/30
                "
                value={selectedYear ?? ""}
                onChange={(e) => {
                  const y = e.target.value || null;
                  setSelectedYear(y);
                  setSelectedMonth(null);
                  setSelectedWeek(null);
                }}
              >
                <option value="">Select Year</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* MONTH SELECT */}
            {timeFrame === "month" && selectedYear && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Month</label>
                <select
                  className="
                    w-full
                    h-10
                    rounded-md
                    border border-white/20
                    bg-black/20
                    text-white text-sm
                    px-3
                    focus:outline-none
                    focus:ring-2
                    focus:ring-white/30
                  "
                  value={selectedMonth ?? ""}
                  onChange={(e) => setSelectedMonth(e.target.value || null)}
                >
                  <option value="">Select Month</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {new Date(`${selectedYear}-${m}-01`).toLocaleString("default", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* WEEK SELECT */}
            {timeFrame === "week" && selectedYear && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Week</label>
                <select
                  className="
                    w-full
                    h-10
                    rounded-md
                    border border-white/20
                    bg-black/20
                    text-white text-sm
                    px-3
                    focus:outline-none
                    focus:ring-2
                    focus:ring-white/30
                  "
                  value={selectedWeek ?? ""}
                  onChange={(e) =>
                    setSelectedWeek(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">Select Week</option>
                  {availableWeeks.map((w) => (
                    <option key={w} value={w}>
                      Week {w}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
