'use client';

import { useState } from 'react';
import { useMembers } from "@/app/hooks/useMembers";
import { useContributions } from "@/app/hooks/use-contributions";
import { useChurchId } from "@/app/hooks/useChurchId";
import { useAttendanceForReports } from "@/app/hooks/useAttendanceForReports";
import { useReportFilters } from "@/app/hooks/useReportFilters";
import { useReportExports } from "@/app/hooks/useReportExports";

import { PageHeader } from "@/app/components/page-header";

import { ReportFiltersPanel } from "@/app/components/reports/ReportFiltersPanel";
import { ReportExportPanel } from "@/app/components/reports/ReportExportPanel";

export default function ReportsPage() {
  const { members } = useMembers();
  const { contributions } = useContributions();
  const { churchId } = useChurchId();

  const { attendance } = useAttendanceForReports(churchId, members);

  // -----------------------------
  // Local State
  // -----------------------------
  const [reportType, setReportType] =
    useState<"members" | "contributions" | "attendance">("attendance");

  const [reportRange, setReportRange] =
    useState<"week" | "month" | "year">("week");

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedFY, setSelectedFY] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [includeVisitors, setIncludeVisitors] = useState(false);

  // -----------------------------
  // Filtering Logic
  // -----------------------------
  const {
    availableYears,
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
    selectedFY,
    selectedCategories: [],
    selectedContributionTypes: [],
    reportRange,
    reportType,
    selectedDate,
  });

  const availableAttendanceDates = Array.from(
    new Set(attendance.map((a) => a.date.split("T")[0]))
  );

  // -----------------------------
  // Export Logic
  // -----------------------------
  const { exportPDF, exportExcel } = useReportExports({
    reportType,
    filteredMembers,
    filteredContributions,
    filteredAttendance,
    selectedFields,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Select a report type below."
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT PANEL */}
        <ReportFiltersPanel
          reportType={reportType}
          setReportType={setReportType}
          members={members}
          selectedMembers={selectedMembers}
          setSelectedMembers={setSelectedMembers}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedFY={selectedFY}
          setSelectedFY={setSelectedFY}
          selectedFields={selectedFields}
          setSelectedFields={setSelectedFields}
          reportRange={reportRange}
          setReportRange={setReportRange}
          includeVisitors={includeVisitors}
          setIncludeVisitors={setIncludeVisitors}
          availableAttendanceDates={availableAttendanceDates}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          availableYears={availableYears}
        />

        {/* RIGHT PANEL */}
        <ReportExportPanel
          reportType={reportType}
          filteredMembers={filteredMembers}
          filteredContributions={filteredContributions}
          filteredAttendance={filteredAttendance}
          selectedFY={selectedFY}
          reportRange={reportRange}
          exportPDF={exportPDF}
          exportExcel={exportExcel}
          members={members}
        />
      </div>
    </div>
  );
}
