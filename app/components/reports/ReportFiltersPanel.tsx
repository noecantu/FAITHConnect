'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { MultiSelect } from "@/app/components/ui/multi-select";
import { Label } from "@/app/components/ui/label";
import { CalendarClock, FilterX } from "lucide-react";

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
  reportType: "none" | "members" | "contributions" | "attendance" | "setlists" | "serviceplans";
  setReportType: (v: "none" | "members" | "contributions" | "attendance" | "setlists" | "serviceplans") => void;

  setListOptions: Array<{ label: string; value: string }>;
  setListYearOptions: string[];
  selectedSetListYear: string | null;
  setSelectedSetListYear: (v: string | null) => void;
  setListMonthOptions: string[];
  selectedSetListMonth: string | null;
  setSelectedSetListMonth: (v: string | null) => void;
  selectedSetListId: string | null;
  setSelectedSetListId: (v: string | null) => void;

  servicePlanOptions: Array<{ label: string; value: string }>;
  servicePlanYearOptions: string[];
  selectedServicePlanYear: string | null;
  setSelectedServicePlanYear: (v: string | null) => void;
  servicePlanMonthOptions: string[];
  selectedServicePlanMonth: string | null;
  setSelectedServicePlanMonth: (v: string | null) => void;
  selectedServicePlanId: string | null;
  setSelectedServicePlanId: (v: string | null) => void;

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
  canReadSetLists: boolean;
  canReadServicePlans: boolean;

  onResetFilters: () => void;
}

export function ReportFiltersPanel({
  reportType,
  setReportType,

  setListOptions,
  setListYearOptions,
  selectedSetListYear,
  setSelectedSetListYear,
  setListMonthOptions,
  selectedSetListMonth,
  setSelectedSetListMonth,
  selectedSetListId,
  setSelectedSetListId,
  servicePlanOptions,
  servicePlanYearOptions,
  selectedServicePlanYear,
  setSelectedServicePlanYear,
  servicePlanMonthOptions,
  selectedServicePlanMonth,
  setSelectedServicePlanMonth,
  selectedServicePlanId,
  setSelectedServicePlanId,

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
  canReadSetLists,
  canReadServicePlans,
  onResetFilters,
}: ReportFiltersPanelProps) {
  const monthLabel = (monthValue: string) =>
    new Date(2000, Number(monthValue) - 1, 1).toLocaleString("default", { month: "long" });

  const activeFilters = [
    reportType !== "none" && reportType === "setlists" && selectedSetListId
      ? setListOptions.find((opt) => opt.value === selectedSetListId)?.label ?? "Selected set list"
      : null,
    reportType === "setlists" && selectedSetListYear ? `Set Lists ${selectedSetListYear}` : null,
    reportType === "setlists" && selectedSetListMonth
      ? `Set Lists ${monthLabel(selectedSetListMonth)}`
      : null,
    reportType !== "none" && reportType === "serviceplans" && selectedServicePlanId
      ? servicePlanOptions.find((opt) => opt.value === selectedServicePlanId)?.label ?? "Selected service plan"
      : null,
    reportType === "serviceplans" && selectedServicePlanYear ? `Service Plans ${selectedServicePlanYear}` : null,
    reportType === "serviceplans" && selectedServicePlanMonth
      ? `Service Plans ${monthLabel(selectedServicePlanMonth)}`
      : null,
    reportType !== "none" && selectedMembers.length > 0 ? `${selectedMembers.length} member${selectedMembers.length === 1 ? "" : "s"}` : null,
    reportType !== "none" && selectedChurches.length > 0 ? `${selectedChurches.length} church${selectedChurches.length === 1 ? "" : "es"}` : null,
    reportType !== "none" && selectedStatus.length > 0 ? `${selectedStatus.length} status` : null,
    reportType !== "none" && selectedYear ? `Year ${selectedYear}` : null,
    reportType !== "none" && selectedMonth && timeFrame === "month" ? `Month ${selectedMonth}` : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <Card className="animate-fadeIn relative h-fit w-full border-white/20 bg-black/80 backdrop-blur-xl lg:sticky lg:top-24 lg:w-[22rem] xl:w-[24rem] 2xl:w-[25rem]">
      <CardHeader className="space-y-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Report Setup</CardTitle>
            <p className="mt-1 text-xs text-white/70">Pick a report type, then narrow the scope.</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2 text-white/80 hover:text-white"
            onClick={onResetFilters}
          >
            <FilterX className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Badge
                key={filter}
                variant="outline"
                className="max-w-full break-words border-white/30 bg-black/40 text-white/85"
              >
                {filter}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-5 sm:space-y-6">

        {/* REPORT TYPE */}
        <div className="rounded-lg border border-white/15 bg-black/50 p-3 transition-colors duration-200">
          <ReportTypeSelect
            value={reportType}
            onChange={setReportType}
            canReadMembers={canReadMembers}
            canReadContributions={canReadContributions}
            canReadAttendance={canReadAttendance}
            canReadSetLists={canReadSetLists}
            canReadServicePlans={canReadServicePlans}
          />
        </div>

        {reportType === "none" && (
          <div className="rounded-lg border border-white/15 bg-black/50 p-3 text-xs text-white/70">
            Select a report type to configure filters.
          </div>
        )}

        {reportType === "serviceplans" && (
          <div className="space-y-3 rounded-lg border border-white/15 bg-black/50 p-3 transition-colors duration-200">
            <Label className="text-sm font-medium">Service Plan Period</Label>
            <div className="grid grid-cols-2 gap-2">
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
                value={selectedServicePlanYear ?? ""}
                onChange={(e) => {
                  setSelectedServicePlanYear(e.target.value || null);
                  setSelectedServicePlanMonth(null);
                }}
              >
                <option value="">Select Year</option>
                {servicePlanYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

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
                value={selectedServicePlanMonth ?? ""}
                onChange={(e) => setSelectedServicePlanMonth(e.target.value || null)}
                disabled={!selectedServicePlanYear}
              >
                <option value="">All Months</option>
                {servicePlanMonthOptions.map((month) => (
                  <option key={month} value={month}>
                    {monthLabel(month)}
                  </option>
                ))}
              </select>
            </div>

            <Label className="text-sm font-medium">Service Plan</Label>
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
              value={selectedServicePlanId ?? ""}
              onChange={(e) => setSelectedServicePlanId(e.target.value || null)}
            >
              <option value="">Select a service plan</option>
              {servicePlanOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {reportType === "setlists" && (
          <div className="space-y-3 rounded-lg border border-white/15 bg-black/50 p-3 transition-colors duration-200">
            <Label className="text-sm font-medium">Set List Period</Label>
            <div className="grid grid-cols-2 gap-2">
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
                value={selectedSetListYear ?? ""}
                onChange={(e) => {
                  setSelectedSetListYear(e.target.value || null);
                  setSelectedSetListMonth(null);
                }}
              >
                <option value="">Select Year</option>
                {setListYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

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
                value={selectedSetListMonth ?? ""}
                onChange={(e) => setSelectedSetListMonth(e.target.value || null)}
                disabled={!selectedSetListYear}
              >
                <option value="">All Months</option>
                {setListMonthOptions.map((month) => (
                  <option key={month} value={month}>
                    {monthLabel(month)}
                  </option>
                ))}
              </select>
            </div>

            <Label className="text-sm font-medium">Set List</Label>
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
              value={selectedSetListId ?? ""}
              onChange={(e) => setSelectedSetListId(e.target.value || null)}
            >
              <option value="">Select a set list</option>
              {setListOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* STATUS (Members Report Only) */}
        {reportType === "members" && (
          <div className="rounded-lg border border-white/15 bg-black/50 p-3 transition-colors duration-200">
            <StatusSelect
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
            />
          </div>
        )}

        {reportType === "contributions" && contributionBreakdownOptions.length > 1 && (
          <div className="space-y-2 rounded-lg border border-white/15 bg-black/50 p-3 transition-colors duration-200">
            <Label className="text-sm font-medium">Breakdown</Label>
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
          <div className="space-y-2 rounded-lg border border-white/15 bg-black/50 p-3 transition-colors duration-200">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Churches</Label>
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
        {reportType !== "none" && reportType !== "setlists" && reportType !== "serviceplans" && (
          <div className="space-y-2 rounded-lg border border-white/15 bg-black/50 p-3 transition-colors duration-200">
            <MemberSelect
              members={members}
              options={memberOptions}
              value={selectedMembers}
              onChange={setSelectedMembers}
            />
            {memberOptions && (
              <p className="text-xs text-muted-foreground">
                {selectedMembers.length === 0
                  ? "All members in scope are included."
                  : `${selectedMembers.length} member${selectedMembers.length === 1 ? "" : "s"} selected.`}
              </p>
            )}
          </div>
        )}

        {/* MEMBER FIELD SELECT (Members Report Only) */}
        {reportType === "members" && (
          <div className="rounded-lg border border-white/15 bg-black/50 p-3 transition-colors duration-200">
            <MemberFieldSelect
              options={memberFieldOptions}
              value={selectedFields}
              onChange={setSelectedFields}
            />
          </div>
        )}

        {/* INCLUDE VISITORS (Attendance Only) */}
        {reportType === "attendance" && (
          <div className="space-y-2 rounded-lg border border-white/15 bg-black/50 p-3 transition-colors duration-200">
            <Label className="text-sm font-medium">Include Visitors</Label>
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
            <div className="space-y-3 rounded-lg border border-white/15 bg-black/50 p-3 transition-colors duration-200">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-white/70" />
                <Label className="text-sm font-medium">Time Frame</Label>
              </div>

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
                          const next = tf as "month" | "year";
                          setTimeFrame(next);

                          // Preserve the active year when changing modes so filtering doesn't reset unexpectedly.
                          if (next === "year") {
                            setSelectedMonth(null);
                          }
                        }}
                      >
                        {tf.charAt(0).toUpperCase() + tf.slice(1)}
                      </Button>
                    );
                  })}
                </div>
            </div>

            {/* YEAR SELECT */}
            <div className="space-y-2 rounded-lg border border-white/15 bg-black/50 p-3 transition-colors duration-200">
              <Label className="text-sm font-medium">Year</Label>
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
              <div className="space-y-2 rounded-lg border border-white/15 bg-black/50 p-3 transition-colors duration-200">
                <Label className="text-sm font-medium">Month</Label>
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
                      {monthLabel(m)}
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
