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

// NEW
import { useUserRoles } from "@/app/hooks/useUserRoles";

export default function ReportsPage() {
  const { members } = useMembers();
  const { contributions } = useContributions();
  const { churchId } = useChurchId();

  const { attendance } = useAttendanceForReports(churchId, members);

  // NEW — permissions
  const {
    canReadMembers,
    canReadContributions,
    canReadAttendance,
  } = useUserRoles();

  // Local State
  const [reportType, setReportType] =
    useState<"members" | "contributions" | "attendance">("attendance");

  const [timeFrame, setTimeFrame] =
    useState<"week" | "month" | "year">("year");

  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [includeVisitors, setIncludeVisitors] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Filtering Logic
  const {
    availableYears,
    availableMonths,
    availableWeeks,
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
    selectedWeek,
  });

  // Export Logic
  const { exportPDF, exportExcel } = useReportExports({
    reportType,
    filteredMembers,
    filteredContributions,
    filteredAttendance,
    selectedFields,
    members,
  });

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      await exportPDF();
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      await exportExcel();
    } finally {
      setIsExportingExcel(false);
    }
  };

  const safeSetReportType = (
    type: "members" | "contributions" | "attendance"
  ) => {
    if (type === "members" && !canReadMembers) return;
    if (type === "contributions" && !canReadContributions) return;
    if (type === "attendance" && !canReadAttendance) return;
    setReportType(type);
  };

  // Auto-select latest year when timeFrame changes
  useEffect(() => {
    if (availableYears.length === 0) return;
    if (!selectedYear) {
      setSelectedYear(availableYears[0]);
    }
  }, [timeFrame, availableYears]);

  // Auto-select latest month when year changes (Month mode)
  useEffect(() => {
    if (timeFrame !== "month") return;
    if (!selectedYear) return;
    if (availableMonths.length === 0) return;

    if (!selectedMonth) {
      setSelectedMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [timeFrame, selectedYear, availableMonths]);

  // Auto-select latest week when year changes (Week mode)
  useEffect(() => {
    if (timeFrame !== "week") return;
    if (!selectedYear) return;
    if (availableWeeks.length === 0) return;

    if (!selectedWeek) {
      setSelectedWeek(availableWeeks[availableWeeks.length - 1]);
    }
  }, [timeFrame, selectedYear, availableWeeks]);

  // NEW — determine if export buttons should show
  const canExport =
    (reportType === "members" && canReadMembers) ||
    (reportType === "contributions" && canReadContributions) ||
    (reportType === "attendance" && canReadAttendance);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Select a report type below."
      >
        {canExport && (
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportPDF}
              size="sm"
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
              onClick={handleExportExcel}
              size="sm"
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
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
          availableYears={availableYears}
          availableMonths={availableMonths}
          availableWeeks={availableWeeks}
          canReadMembers={canReadMembers}
          canReadContributions={canReadContributions}
          canReadAttendance={canReadAttendance}
        />

        {/* RIGHT PANEL */}
        <div className="space-y-6 w-full">

          {/* MEMBER REPORT */}
          {reportType === "members" && canReadMembers && (
            <MemberPreviewTable
              members={filteredMembers}
              selectedFields={selectedFields}
            />
          )}

          {/* CONTRIBUTIONS REPORT */}
          {reportType === "contributions" && canReadContributions && (
            <ContributionPreviewTable
              contributions={filteredContributions}
              members={members}
              selectedFields={[]}
            />
          )}

          {/* ATTENDANCE REPORT */}
          {reportType === "attendance" && canReadAttendance && (
            <AttendancePreviewTable
              attendance={filteredAttendance}
              members={members}
            />
          )}

        </div>
      </div>
    </div>
  );
}
