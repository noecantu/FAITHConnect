'use client';

import { useState } from 'react';

import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Separator } from '@/app/components/ui/separator';
import { Button } from '@/app/components/ui/button';

import { useChurchId } from "@/app/hooks/useChurchId";
import { useMembers } from '@/app/hooks/useMembers';
import { useContributions } from '@/app/hooks/use-contributions';
import { useAttendanceForReports } from '@/app/hooks/useAttendanceForReports';

import { useReportFilters } from '@/app/hooks/useReportFilters';
import { useReportExports } from '@/app/hooks/useReportExports';

// Filter components
import { ReportTypeSelect } from '@/app/components/reports/ReportTypeSelect';
import { MemberSelect } from '@/app/components/reports/MemberSelect';
import { StatusSelect } from '@/app/components/reports/StatusSelect';
import { YearSelect } from '@/app/components/reports/YearSelect';
import { MemberFieldSelect } from '@/app/components/reports/MemberFieldSelect';
import { ReportRangeSelect } from '@/app/components/reports/ReportRangeSelect';

// Preview table components
import { MemberPreviewTable } from '@/app/components/reports/MemberPreviewTable';
import { ContributionPreviewTable } from '@/app/components/reports/ContributionPreviewTable';
import { AttendancePreviewTable } from '@/app/components/reports/AttendancePreviewTable';

import { PageHeader } from '../components/page-header';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";
import { AttendanceRecord, Contribution, Member } from '../lib/types';

export default function ReportsPage() {
  const { members } = useMembers();
  const { contributions } = useContributions();
  const { churchId } = useChurchId();

  const { attendance } = useAttendanceForReports(churchId, members);

  const [reportType, setReportType] =
    useState<'members' | 'contributions' | 'attendance'>('attendance');

  const [reportRange, setReportRange] =
    useState<'week' | 'month' | 'year'>('week');

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedFY, setSelectedFY] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const statusOptions = [
    { label: "Active", value: "Active" },
    { label: "Prospect", value: "Prospect" },
    { label: "Archived", value: "Archived" },
  ];

  const memberFieldOptions = [
    { label: "Status", value: "status" },
    { label: "Email", value: "email" },
    { label: "Phone Number", value: "phoneNumber" },
    { label: "Birthday", value: "birthday" },
    { label: "Baptism Date", value: "baptismDate" },
    { label: "Anniversary", value: "anniversary" },
    { label: "Address", value: "address" },
    { label: "Check-In Code", value: "checkInCode" },
    { label: "QR Code", value: "qrCode" },
    { label: "Notes", value: "notes" },
  ];
  

  const fieldLabelMap: Record<string, string> = {
    status: "Status",
    email: "Email",
    phoneNumber: "Phone Number",
    birthday: "Birthday",
    baptismDate: "Baptism Date",
    anniversary: "Anniversary",
    address: "Address",
    checkInCode: "Check-In Code",
    qrCode: "QR Code",
    notes: "Notes",
  };

  // Filtering logic
  const {
    availableYears,
    filteredMembers,
    filteredContributions,
    filteredAttendance,
  } = useReportFilters({
    members,
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
    new Set(attendance.map(a => a.date.split("T")[0]))
  );
  
  // Export logic
  const {
    exportPDF,
    exportExcel,
    formatField,
  } = useReportExports({
    reportType,
    filteredMembers,
    filteredContributions,
    filteredAttendance,
    selectedFields,
  });

  function formatDateString(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function sortMembersByName(members: Member[]) {
    return [...members].sort((a, b) => {
      const lastA = (a.lastName ?? "").toLowerCase();
      const lastB = (b.lastName ?? "").toLowerCase();

      if (lastA < lastB) return -1;
      if (lastA > lastB) return 1;

      const firstA = (a.firstName ?? "").toLowerCase();
      const firstB = (b.firstName ?? "").toLowerCase();

      if (firstA < firstB) return -1;
      if (firstA > firstB) return 1;

      return 0;
    });
  }

  function sortContributionsByMemberName(contributions: Contribution[], members: Member[]) {
    return [...contributions].sort((a, b) => {
      const memberA = members.find(m => m.id === a.memberId);
      const memberB = members.find(m => m.id === b.memberId);

      const lastA = (memberA?.lastName ?? "").toLowerCase();
      const lastB = (memberB?.lastName ?? "").toLowerCase();

      if (lastA < lastB) return -1;
      if (lastA > lastB) return 1;

      const firstA = (memberA?.firstName ?? "").toLowerCase();
      const firstB = (memberB?.firstName ?? "").toLowerCase();

      if (firstA < firstB) return -1;
      if (firstA > firstB) return 1;

      return 0;
    });
  }

  function sortAttendance(records: AttendanceRecord[], members: Member[]) {
    return [...records].sort((a, b) => {
      // 1. Sort by date
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;

      // 2. Lookup members
      const memberA = members.find(m => m.id === a.memberId);
      const memberB = members.find(m => m.id === b.memberId);

      const lastA = (memberA?.lastName ?? "").toLowerCase();
      const lastB = (memberB?.lastName ?? "").toLowerCase();
      if (lastA < lastB) return -1;
      if (lastA > lastB) return 1;

      const firstA = (memberA?.firstName ?? "").toLowerCase();
      const firstB = (memberB?.firstName ?? "").toLowerCase();
      if (firstA < firstB) return -1;
      if (firstA > firstB) return 1;

      return 0;
    });
  }

  return (
  <div className="space-y-6">
      <PageHeader
      title={`Reports`}
      subtitle={`Select a report type below.`}
      />
    <div className="flex flex-col lg:flex-row gap-6">
      {/* LEFT PANEL — Filters */}
      <Card className="w-full lg:w-80 h-fit">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          <ReportTypeSelect
            value={reportType}
            onChange={setReportType}
          />

          <MemberSelect
            members={members}
            value={selectedMembers}
            onChange={setSelectedMembers}
          />

          {reportType === "contributions" && (
            <MemberFieldSelect
              options={[
                { label: "Member", value: "memberName" },
                { label: "Amount", value: "amount" },
                { label: "Date", value: "date" },
                { label: "Category", value: "category" },
                { label: "Type", value: "contributionType" },
                { label: "Notes", value: "notes" },
              ]}
              value={selectedFields}
              onChange={setSelectedFields}
            />
          )}

          {reportType === "members" && (
            <StatusSelect
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
            />
          )}

          {(reportType === "contributions" || reportType === "attendance") && (
            <ReportRangeSelect
              value={reportRange}
              onChange={setReportRange}
            />
          )}

          {reportType === "contributions" && (
            <YearSelect
              years={availableYears}
              value={selectedFY}
              onChange={setSelectedFY}
            />
          )}

          {reportType === "members" && (
            <MemberFieldSelect
              options={memberFieldOptions}
              value={selectedFields}
              onChange={setSelectedFields}
            />
          )}

          {reportType === "attendance" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Date
              </label>

              <Select
                value={selectedDate ?? "all"}
                onValueChange={(v) => setSelectedDate(v === "all" ? null : v)}
              >
                <SelectTrigger className="bg-black/20 border-white/20 text-white">
                  <SelectValue placeholder="All Dates" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>

                  {availableAttendanceDates.map((d) => (
                    <SelectItem key={d} value={d}>
                      {formatDateString(d)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

        </CardContent>
      </Card>

      {/* RIGHT PANEL — Preview + Export */}
      <Card className="flex-1 w-full">
        <CardHeader>
          <CardTitle>Export</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          <div className="text-sm text-muted-foreground">
            {reportType === 'members' && (
              <p>Members Selected: {filteredMembers.length}</p>
            )}

            {reportType === 'contributions' && (
              <>
                <p>Contributions: {filteredContributions.length}</p>
                <p>Year: {selectedFY.length === 0 ? "No Year Selected" : selectedFY.join(", ")}</p>
              </>
            )}

            {reportType === 'attendance' && (
              <>
                <p>Attendance Records: {filteredAttendance.length}</p>
                <p>Range: {reportRange.charAt(0).toUpperCase() + reportRange.slice(1)}</p>
              </>
            )}
          </div>

          <div className="border rounded-md overflow-x-auto">
            <div className="min-w-max">

              {reportType === "attendance" && (
                <AttendancePreviewTable
                  attendance={sortAttendance(filteredAttendance, members)}
                  members={sortMembersByName(members)}
                />
              )}

              {reportType === "contributions" && (
                <ContributionPreviewTable
                  contributions={sortContributionsByMemberName(filteredContributions, members)}
                  members={sortMembersByName(members)}
                  selectedFields={selectedFields}
                />
              )}

              {reportType === "members" && (
                <MemberPreviewTable
                  members={sortMembersByName(filteredMembers)}
                  selectedFields={selectedFields}
                  fieldLabelMap={fieldLabelMap}
                  formatField={formatField}
                />
              )}

            </div>
          </div>
          <Separator />

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
            <Button onClick={exportPDF} className="w-full sm:w-auto">
              Export PDF
            </Button>

            <Button
              variant="secondary"
              onClick={exportExcel}
              className="w-full sm:w-auto"
            >
              Export Excel
            </Button>
          </div>

        </CardContent>
      </Card>

    </div>
  </div>
  );
}
