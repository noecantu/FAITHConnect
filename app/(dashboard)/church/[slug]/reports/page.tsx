'use client';

import { useEffect, useState } from 'react';
import { useMembers } from "@/app/hooks/useMembers";
import { useContributions } from "@/app/hooks/use-contributions";
import { useChurchId } from "@/app/hooks/useChurchId";
import { useAttendanceForReports } from "@/app/hooks/useAttendanceForReports";
import { useReportFilters } from "@/app/hooks/useReportFilters";
import { useReportExports } from "@/app/hooks/useReportExports";
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
  const { contributions } = useContributions();
  const { churchId } = useChurchId();
  const { attendance } = useAttendanceForReports(churchId, members);

  const {
    loading: permissionsLoading,
    canReadMembers,
    canReadContributions,
    canReadAttendance,
    canReadReports,
  } = usePermissions();

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
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
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

  // -------------------------------------------------------
  // 4. FILTERING LOGIC HOOK
  // -------------------------------------------------------
  const {
    availableYears,
    availableMonths,
    filteredMembers,
    filteredContributions,
    filteredAttendance,
  } = useReportFilters({
    members,
    includeVisitors,
    contributions,
    attendance,
    selectedMembers,
    selectedStatus,
    selectedCategories: [],
    selectedContributionTypes: [],
    reportType,
    timeFrame,
    selectedYear,
    selectedMonth,
    // selectedWeek,
  });

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
  });

  // -------------------------------------------------------
  // 6. SAFE REPORT TYPE SWITCHING
  // -------------------------------------------------------
  const safeSetReportType = (
    type: "members" | "contributions" | "attendance"
  ) => {
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
  if (!churchId || permissionsLoading) {
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
          selectedMembers={selectedMembers}
          setSelectedMembers={setSelectedMembers}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
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
          canReadMembers={canReadMembers}
          canReadContributions={canReadContributions}
          canReadAttendance={canReadAttendance}
        />

        {/* RIGHT PANEL */}
        <div className="space-y-6 w-full min-w-0">
          {reportType === "attendance" && canReadAttendance && (
            <AttendancePreviewTable
              attendance={filteredAttendance}
              members={members}
            />
          )}

          {reportType === "contributions" && canReadContributions && (
            <ContributionPreviewTable
              contributions={filteredContributions}
              members={members}
              selectedFields={[]}
            />
          )}

          {reportType === "members" && canReadMembers && (
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