'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";

import { Button } from "@/app/components/ui/button";
import { MultiSelect } from "@/app/components/ui/multi-select";

import { ReportTypeSelect } from "./ReportTypeSelect";
import { MemberSelect } from "./MemberSelect";
import { MemberFieldSelect } from "./MemberFieldSelect";
import { StatusSelect } from "./StatusSelect";

import { statusOptions, memberFieldOptions } from "@/app/lib/constants/reportOptions";
import type { ContributionBreakdown } from "@/app/hooks/useContributionReport";

type ContributionBreakdownOption = {
  label: string;
  value: ContributionBreakdown;
};

interface ReportFiltersPanelProps {
  reportType: "members" | "contributions" | "attendance";
  setReportType: (v: any) => void;

  members: any[];
  memberOptions?: Array<{ label: string; value: string }>;
  selectedMembers: string[];
  setSelectedMembers: (v: string[]) => void;

  selectedChurches: string[];
  setSelectedChurches: (v: string[]) => void;
  churchOptions: Array<{ label: string; value: string }>;

  selectedStatus: string[];
  setSelectedStatus: (v: string[]) => void;

  contributionBreakdown: ContributionBreakdown;
  setContributionBreakdown: (v: ContributionBreakdown) => void;
  contributionBreakdownOptions: ContributionBreakdownOption[];

  selectedFields: string[];
  setSelectedFields: (v: string[]) => void;

  includeVisitors: boolean;
  setIncludeVisitors: (v: boolean) => void;

  timeFrame: "month" | "year";
  setTimeFrame: (v: "month" | "year") => void;

  selectedYear: string | null;
  setSelectedYear: (v: string | null) => void;

  selectedMonth: string | null;
  setSelectedMonth: (v: string | null) => void;

  availableYears: string[];
  availableMonths: string[];

  canReadMembers: boolean;
  canReadContributions: boolean;
  canReadAttendance: boolean;
}

export function ReportFiltersPanel({
  reportType,
  setReportType,

  members,
  memberOptions,
  selectedMembers,
  setSelectedMembers,

  selectedChurches,
  setSelectedChurches,
  churchOptions,

  selectedStatus,
  setSelectedStatus,

  contributionBreakdown,
  setContributionBreakdown,
  contributionBreakdownOptions,

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
  availableYears,
  availableMonths,
  canReadMembers,
  canReadContributions,
  canReadAttendance,
}: ReportFiltersPanelProps) {
  return (
    // <Card className="w-full lg:w-80 h-fit">
    <Card className="relative w-full lg:w-80 h-fit bg-black/80 border-white/20 backdrop-blur-xl">
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

        {/* STATUS (Members Report Only) */}
        {reportType === "members" && (
          <StatusSelect
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
          />
        )}

        {reportType === "contributions" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Breakdown</label>
            <select
              className="
                w-full
                h-10
                rounded-md
                border border-white/20
                bg-black/80
                text-white text-sm
                px-3
                focus:outline-none
                focus:ring-2
                focus:ring-white/30
              "
              value={contributionBreakdown}
              onChange={(e) =>
                setContributionBreakdown(e.target.value as ContributionBreakdown)
              }
            >
              {contributionBreakdownOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {reportType === "contributions" && churchOptions.length > 1 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Churches</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSelectedChurches(
                    selectedChurches.length > 0
                      ? []
                      : churchOptions.map((option) => option.value)
                  )
                }
              >
                {selectedChurches.length > 0 ? "Clear All" : "Select All"}
              </Button>
            </div>
            <MultiSelect
              options={churchOptions}
              value={selectedChurches}
              onChange={setSelectedChurches}
              placeholder="All Churches"
            />
            <p className="text-xs text-muted-foreground">
              {selectedChurches.length === 0
                ? "All churches in scope are included."
                : `${selectedChurches.length} church${selectedChurches.length === 1 ? "" : "es"} selected.`}
            </p>
          </div>
        )}

        {/* MEMBER SELECT */}
        <MemberSelect
          members={members}
          options={memberOptions}
          value={selectedMembers}
          onChange={setSelectedMembers}
        />
        {memberOptions && (
          <p className="text-xs text-muted-foreground -mt-4">
            {selectedMembers.length === 0
              ? "All members in scope are included."
              : `${selectedMembers.length} member${selectedMembers.length === 1 ? "" : "s"} selected.`}
          </p>
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
                bg-black/80
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
                <div className="grid grid-cols-2 gap-2 w-full">
                  {["month", "year"].map((tf) => {
                    const isActive = timeFrame === tf;

                    return (
                      <Button
                        key={tf}
                        variant={isActive ? "default" : "outline"}
                        className={`
                          w-full
                          ${isActive ? "" : "bg-black/80 border border-white/20 backdrop-blur-xl"}
                        `}
                        onClick={() => {
                          setTimeFrame(tf as any);
                          setSelectedYear(null);
                          setSelectedMonth(null);
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
                  bg-black/80
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
                    bg-black/80
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
