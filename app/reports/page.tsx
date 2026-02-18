'use client';

import { useState } from 'react';

import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';

import { useMembers } from '../hooks/useMembers';
import { useContributions } from '../hooks/use-contributions';

import { useReportFilters } from '../hooks/useReportFilters';
import { useReportExports } from '../hooks/useReportExports';

// Filter components
import { ReportTypeSelect } from '../components/reports/ReportTypeSelect';
import { MemberSelect } from '../components/reports/MemberSelect';
import { StatusSelect } from '../components/reports/StatusSelect';
import { YearSelect } from '../components/reports/YearSelect';
import { MemberFieldSelect } from '../components/reports/MemberFieldSelect';

// Preview table components
import { MemberPreviewTable } from '../components/reports/MemberPreviewTable';
import { ContributionPreviewTable } from '../components/reports/ContributionPreviewTable';
import { useChurchId } from '../hooks/useChurchId';
import { ContributionRangeSelect } from '../components/reports/ContributionRangeSelect';

export default function ReportsPage() {
  const { churchId } = useChurchId();
  const { members } = useMembers(churchId);
  const { contributions } = useContributions();

  const [reportType, setReportType] =
    useState<'members' | 'contributions'>('members');
    const [contributionRange, setContributionRange] =
    useState<'week' | 'month' | 'year'>('year');

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedFY, setSelectedFY] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

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
    { label: "Notes", value: "notes" },
    { label: "Roles", value: "roles" },
  ];

  const fieldLabelMap: Record<string, string> = {
    status: "Status",
    email: "Email",
    phoneNumber: "Phone Number",
    birthday: "Birthday",
    baptismDate: "Baptism Date",
    anniversary: "Anniversary",
    address: "Address",
    notes: "Notes",
    roles: "Roles",
  };

  // Filtering logic (Option A)
  const {
    availableYears,
    filteredMembers,
    filteredContributions,
  } = useReportFilters({
    members,
    contributions,
    selectedMembers,
    selectedStatus,
    selectedFY,
    selectedCategories: [], // not implemented yet
    selectedContributionTypes: [],
    contributionRange,
    reportType, // ← ADD THIS
  });

  // Export logic (Option B)
  const {
    exportPDF,
    exportExcel,
    formatField,
  } = useReportExports({
    reportType,
    filteredMembers,
    filteredContributions,
    selectedFields,
  });

  return (
    <>
      
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

          {reportType === "members" && (
            <StatusSelect
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
            />
          )}

          {reportType === "contributions" && (
            <ContributionRangeSelect
              value={contributionRange}
              onChange={setContributionRange}
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

        </CardContent>
      </Card>

      {/* RIGHT PANEL — Preview + Export */}
      <Card className="flex-1 w-full">
        <CardHeader>
          <CardTitle>Export</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          <div className="text-sm text-muted-foreground">
            {reportType === 'members' ? (
              <p>Members Selected: {filteredMembers.length}</p>
            ) : (
              <>
                <p>Contributions: {filteredContributions.length}</p>
                <p>
                  Year: {selectedFY.length === 0 ? "No Year Selected" : selectedFY.join(", ")}
                </p>
              </>
            )}
          </div>

          <div className="border rounded-md overflow-hidden">
            {reportType === "members" ? (
              <MemberPreviewTable
                members={filteredMembers}
                selectedFields={selectedFields}
                fieldLabelMap={fieldLabelMap}
                formatField={formatField}
              />
            ) : (
              <ContributionPreviewTable
                contributions={filteredContributions}
                members={members}
              />
            )}
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

    </>
  );
}
