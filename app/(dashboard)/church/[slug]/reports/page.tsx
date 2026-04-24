'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMembers } from "@/app/hooks/useMembers";
import { useContributions } from "@/app/hooks/use-contributions";
import { useScopedContributions } from "@/app/hooks/useScopedContributions";
import { useChurchId } from "@/app/hooks/useChurchId";
import { useAttendanceForReports } from "@/app/hooks/useAttendanceForReports";
import { useReportFilters } from "@/app/hooks/useReportFilters";
import { useReportExports } from "@/app/hooks/useReportExports";
import type { ContributionBreakdown } from "@/app/hooks/useContributionReport";
import { PageHeader } from "@/app/components/page-header";
import { ReportFiltersPanel } from "@/app/components/reports/ReportFiltersPanel";
import { MemberPreviewTable } from "@/app/components/reports/MemberPreviewTable";
import { AttendancePreviewTable } from "@/app/components/reports/AttendancePreviewTable";
import { ContributionPreviewTable } from "@/app/components/reports/ContributionPreviewTable";
import { Button } from "@/app/components/ui/button";
import { FileText, Loader2, Sheet } from "lucide-react";

import { usePermissions } from "@/app/hooks/usePermissions";

export default function ReportsPage() {
  // -------------------------------------------------------
  // 1. ALL HOOKS MUST RUN FIRST (fixes hook-order errors)
  // -------------------------------------------------------
  const { members } = useMembers();
  const { contributions: churchContributions } = useContributions();
  const { churchId } = useChurchId();
  const { attendance } = useAttendanceForReports(churchId, members);

  const {
    loading: permissionsLoading,
    canReadMembers,
    canReadContributions,
    canReadAttendance,
    canReadReports,
    isDistrictAdmin,
    isRegionalAdmin,
  } = usePermissions();

  const needsScopedContributions = isDistrictAdmin || isRegionalAdmin;
  const {
    contributions: scopedContributions,
    loading: scopedContributionsLoading,
  } = useScopedContributions({ enabled: needsScopedContributions });

  const contributions = needsScopedContributions
    ? scopedContributions
    : churchContributions;
  const scopedContributionOnly = needsScopedContributions;

  // -------------------------------------------------------
  // 2. LOCAL STATE HOOKS
  // -------------------------------------------------------
  const [reportType, setReportType] =
    useState<"members" | "contributions" | "attendance">("contributions");

  const [timeFrame, setTimeFrame] =
    useState<"month" | "year">("year");

  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedChurches, setSelectedChurches] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [contributionBreakdown, setContributionBreakdown] =
    useState<ContributionBreakdown>("member");
  const [includeVisitors, setIncludeVisitors] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // -------------------------------------------------------
  // 3. AUTO-SELECT FIRST ALLOWED REPORT TYPE
  // -------------------------------------------------------
  useEffect(() => {
    if (permissionsLoading) return;

    if (canReadContributions) {
      setReportType("contributions");
    } else if (canReadMembers) {
      setReportType("members");
    } else if (canReadAttendance) {
      setReportType("attendance");
    }
  }, [
    permissionsLoading,
    canReadMembers,
    canReadContributions,
    canReadAttendance
  ]);

  const contributionBreakdownOptions = useMemo(() => {
    if (isDistrictAdmin) {
      return [
        { label: "District", value: "district" as const },
        { label: "Region", value: "region" as const },
        { label: "Church", value: "church" as const },
        { label: "Member", value: "member" as const },
      ];
    }

    if (isRegionalAdmin) {
      return [
        { label: "Region", value: "region" as const },
        { label: "Church", value: "church" as const },
        { label: "Member", value: "member" as const },
      ];
    }

    return [{ label: "Member", value: "member" as const }];
  }, [isDistrictAdmin, isRegionalAdmin]);

  useEffect(() => {
    const allowed = contributionBreakdownOptions.map((option) => option.value);
    if (!allowed.includes(contributionBreakdown)) {
      setContributionBreakdown(allowed[0]);
    }
  }, [contributionBreakdown, contributionBreakdownOptions]);

  const churchOptions = useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();

    contributions.forEach((contribution) => {
      if (contribution.churchId && contribution.churchName) {
        map.set(contribution.churchId, {
          label: contribution.churchName,
          value: contribution.churchId,
        });
        return;
      }

      if (contribution.churchName) {
        const key = `name:${contribution.churchName}`;
        map.set(key, {
          label: contribution.churchName,
          value: key,
        });
      }
    });

    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [contributions]);

  const memberOptions = useMemo(() => {
    if (!needsScopedContributions) {
      return members
        .map((member) => ({
          label: `${member.firstName} ${member.lastName}`,
          value: member.id,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    const map = new Map<string, { label: string; value: string }>();

    contributions.forEach((contribution) => {
      const name = (contribution.memberName ?? "").trim();
      if (!name) return;

      map.set(`name:${name}`, {
        label: name,
        value: `name:${name}`,
      });
    });

    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [needsScopedContributions, members, contributions]);

  const selectedChurchLabels = useMemo(() => {
    if (selectedChurches.length === 0) {
      return churchOptions.map((option) => option.label);
    }

    const map = new Map(churchOptions.map((option) => [option.value, option.label]));
    return selectedChurches
      .map((value) => map.get(value))
      .filter((label): label is string => Boolean(label));
  }, [selectedChurches, churchOptions]);

  const selectedMemberLabels = useMemo(() => {
    if (selectedMembers.length === 0) return [];

    const map = new Map(memberOptions.map((option) => [option.value, option.label]));
    return selectedMembers
      .map((value) => map.get(value))
      .filter((label): label is string => Boolean(label));
  }, [selectedMembers, memberOptions]);

  // -------------------------------------------------------
  // 4. FILTERING LOGIC HOOK
  // -------------------------------------------------------
  const {
    availableYears,
    availableMonths,
    filteredMembers,
    filteredContributions,
    contributionBreakdownRows,
    filteredAttendance,
  } = useReportFilters({
    members,
    includeVisitors,
    contributions,
    attendance,
    selectedMembers,
    selectedChurches,
    selectedStatus,
    selectedCategories: [],
    selectedContributionTypes: [],
    contributionBreakdown,
    reportType,
    timeFrame,
    selectedYear,
    selectedMonth,
    // selectedWeek,
  });

  const contributionTotalAmount = useMemo(() => {
    return filteredContributions.reduce((sum, contribution) => sum + contribution.amount, 0);
  }, [filteredContributions]);

  const contributionExportContext = useMemo(() => {
    const monthLabel =
      timeFrame === "month" && selectedYear && selectedMonth
        ? `${selectedYear}-${selectedMonth}`
        : selectedYear ?? "All Years";

    const scopedLabel = needsScopedContributions
      ? isDistrictAdmin
        ? "District Scope"
        : "Regional Scope"
      : "Church Scope";

    return {
      contextLines: [
        `Scope: ${scopedLabel}`,
        `Breakdown: ${contributionBreakdown.charAt(0).toUpperCase()}${contributionBreakdown.slice(1)}`,
        `Period: ${monthLabel}`,
        `Churches: ${selectedChurchLabels.length > 0 ? selectedChurchLabels.join(", ") : "All"}`,
        `Members: ${selectedMemberLabels.length > 0 ? selectedMemberLabels.join(", ") : "All"}`,
        `Rows: ${contributionBreakdownRows.length}`,
        `Total: $${contributionTotalAmount.toFixed(2)}`,
      ],
    };
  }, [
    timeFrame,
    selectedYear,
    selectedMonth,
    needsScopedContributions,
    isDistrictAdmin,
    contributionBreakdown,
    selectedChurchLabels,
    selectedMemberLabels,
    contributionBreakdownRows.length,
    contributionTotalAmount,
  ]);

  // -------------------------------------------------------
  // 5. EXPORT LOGIC HOOK
  // -------------------------------------------------------
  const { exportPDF, exportExcel } = useReportExports({
    reportType,
    filteredMembers,
    filteredContributions,
    filteredAttendance,
    selectedFields,
    members,
    contributionExportContext,
  });

  // -------------------------------------------------------
  // 6. SAFE REPORT TYPE SWITCHING
  // -------------------------------------------------------
  const safeSetReportType = (
    type: "members" | "contributions" | "attendance"
  ) => {
    if (scopedContributionOnly && type !== "contributions") return;
    if (type === "members" && !canReadMembers) return;
    if (type === "contributions" && !canReadContributions) return;
    if (type === "attendance" && !canReadAttendance) return;
    setReportType(type);
  };

  // -------------------------------------------------------
  // 7. AUTO-SELECT YEAR/MONTH/WEEK
  // -------------------------------------------------------
  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0]);
    }
  }, [timeFrame, availableYears]);

  useEffect(() => {
    if (timeFrame === "month" && selectedYear && availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [timeFrame, selectedYear, availableMonths]);

  // -------------------------------------------------------
  // 8. EXPORT BUTTON VISIBILITY
  // -------------------------------------------------------
  const canExport =
    (reportType === "members" && canReadMembers) ||
    (reportType === "contributions" && canReadContributions) ||
    (reportType === "attendance" && canReadAttendance);

  // -------------------------------------------------------
  // 9. EARLY PERMISSION GATE (AFTER ALL HOOKS)
  // -------------------------------------------------------
  if (permissionsLoading || scopedContributionsLoading || (!churchId && !needsScopedContributions)) {
    return (
      <>
        <PageHeader title="Reports" />
        <p className="text-muted-foreground">Loading reports…</p>
      </>
    );
  }

  if (!canReadReports) {
    return (
      <>
        <PageHeader title="Reports" />
        <p className="text-muted-foreground">
          You do not have permission to view reports.
        </p>
      </>
    );
  }

  // -------------------------------------------------------
  // 10. RENDER PAGE
  // -------------------------------------------------------
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Select a report type below."
      >
        {canExport && (
          <div className="flex items-center gap-2">
            <Button
              onClick={async () => {
                setIsExportingPDF(true);
                await exportPDF();
                setIsExportingPDF(false);
              }}
              size="sm"
              variant="outline"
              className="bg-black/80 border border-white/20 backdrop-blur-xl"
              disabled={isExportingPDF || isExportingExcel}
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  PDF
                </>
              ) : (
                "PDF"
              )}
              <FileText className="h-5 w-5" />
            </Button>

            <Button
              onClick={async () => {
                setIsExportingExcel(true);
                await exportExcel();
                setIsExportingExcel(false);
              }}
              size="sm"
              variant="outline"
              className="bg-black/80 border border-white/20 backdrop-blur-xl"
              disabled={isExportingPDF || isExportingExcel}
            >
              {isExportingExcel ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excel
                </>
              ) : (
                "Excel"
              )}
              <Sheet className="h-5 w-5" />
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT PANEL */}
        <ReportFiltersPanel
          reportType={reportType}
          setReportType={safeSetReportType}
          members={members}
          memberOptions={memberOptions}
          selectedMembers={selectedMembers}
          setSelectedMembers={setSelectedMembers}
          selectedChurches={selectedChurches}
          setSelectedChurches={setSelectedChurches}
          churchOptions={churchOptions}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          contributionBreakdown={contributionBreakdown}
          setContributionBreakdown={setContributionBreakdown}
          contributionBreakdownOptions={contributionBreakdownOptions}
          selectedFields={selectedFields}
          setSelectedFields={setSelectedFields}
          includeVisitors={includeVisitors}
          setIncludeVisitors={setIncludeVisitors}
          timeFrame={timeFrame}
          setTimeFrame={setTimeFrame}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          availableYears={availableYears}
          availableMonths={availableMonths}
          canReadMembers={!scopedContributionOnly && canReadMembers}
          canReadContributions={canReadContributions}
          canReadAttendance={!scopedContributionOnly && canReadAttendance}
        />

        {/* RIGHT PANEL */}
        <div className="space-y-6 w-full min-w-0">
          {reportType === "contributions" && canReadContributions && (
            <div className="rounded-md border border-white/20 bg-black/50 p-4 text-sm text-white/90 backdrop-blur-xl">
              <div className="font-semibold mb-2">Report Scope Summary</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-white/80">
                <div>
                  Scope: {needsScopedContributions ? (isDistrictAdmin ? "District" : "Region") : "Church"}
                </div>
                <div>
                  Breakdown: {contributionBreakdown.charAt(0).toUpperCase() + contributionBreakdown.slice(1)}
                </div>
                <div>
                  Churches: {selectedChurchLabels.length > 0 ? selectedChurchLabels.length : "All"}
                </div>
                <div>
                  Members: {selectedMemberLabels.length > 0 ? selectedMemberLabels.length : "All"}
                </div>
                <div>
                  Rows: {contributionBreakdownRows.length}
                </div>
                <div>
                  Total: ${contributionTotalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {reportType === "attendance" && !scopedContributionOnly && canReadAttendance && (
            <AttendancePreviewTable
              attendance={filteredAttendance}
              members={members}
            />
          )}

          {reportType === "contributions" && canReadContributions && (
            <>
              {filteredContributions.length === 0 && (
                <div className="rounded-md border border-white/20 bg-black/30 p-4 text-sm text-muted-foreground">
                  No contribution records match the current filters. Try widening Churches, Members, or Date filters.
                </div>
              )}

              <ContributionPreviewTable
                contributions={filteredContributions}
                members={members}
                selectedFields={[]}
                breakdown={contributionBreakdown}
                breakdownRows={contributionBreakdownRows}
                useGroupedView={scopedContributionOnly}
              />
            </>
          )}

          {reportType === "members" && !scopedContributionOnly && canReadMembers && (
            <MemberPreviewTable
              members={filteredMembers}
              selectedFields={selectedFields}
            />
          )}
        </div>
      </div>
    </>
  );
}