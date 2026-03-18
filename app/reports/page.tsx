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

import { MemberPreviewTable } from "@/app/components/reports/MemberPreviewTable";

import { AttendancePreviewTable } from "@/app/components/reports/AttendancePreviewTable";
import { ContributionPreviewTable } from "@/app/components/reports/ContributionPreviewTable";

import { Button } from "@/app/components/ui/button";
import { FileText, Sheet } from "lucide-react";

export default function ReportsPage() {
  const { members } = useMembers();
  const { contributions } = useContributions();
  const { churchId } = useChurchId();

  const { attendance } = useAttendanceForReports(churchId, members);

  // Local State
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

  // Filtering Logic
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

  // Export Logic
  const { exportPDF, exportExcel } = useReportExports({
    reportType,
    filteredMembers,
    filteredContributions,
    filteredAttendance,
    selectedFields,
    members,
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
        <div className="space-y-6 w-full">

          {/* MEMBER REPORT */}
          {reportType === "members" && (
            <>

              <MemberPreviewTable
                members={filteredMembers}
                selectedFields={selectedFields}
              />

              {/* EXPORT ACTIONS */}
              <div className="space-y-2">
                <Button onClick={exportPDF} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>

                <Button onClick={exportExcel} variant="outline" className="w-full">
                  <Sheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </>
          )}

          {/* CONTRIBUTIONS REPORT */}
          {reportType === "contributions" && (
            <>
              <ContributionPreviewTable
                contributions={filteredContributions}
                members={members} selectedFields={selectedFields}
              />

              <div className="space-y-2">
                <Button onClick={exportPDF} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>

                <Button onClick={exportExcel} variant="outline" className="w-full">
                  <Sheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </>
          )}

          {/* ATTENDANCE REPORT */}
          {reportType === "attendance" && (
            <>
              <AttendancePreviewTable
                attendance={filteredAttendance}
                members={members}
              />

              <div className="space-y-2">
                <Button onClick={exportPDF} className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>

                <Button onClick={exportExcel} variant="outline" className="w-full">
                  <Sheet className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
