'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

import { useMembers } from '@/hooks/use-members';
import { useContributions } from '@/hooks/use-contributions';

import {
  generateMembersPDF,
  generateMembersExcel,
  generateContributionsPDF,
  generateContributionsExcel
} from '@/lib/reports';
import { Address, Member } from '@/lib/types';

export default function ReportsPage() {
  const { members } = useMembers();
  const { contributions } = useContributions();

  const [reportType, setReportType] =
    useState<'members' | 'contributions'>('members');

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedFY, setSelectedFY] = useState<string[]>([]);

  // Fields to export for Member List (plain strings)
  const memberFieldOptions = [
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
    email: "Email",
    phoneNumber: "Phone Number",
    birthday: "Birthday",
    baptismDate: "Baptism Date",
    anniversary: "Anniversary",
    address: "Address",
    notes: "Notes",
    roles: "Roles",
  };  

  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    contributions.forEach((c) => {
      years.add(new Date(c.date).getFullYear().toString());
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [contributions]);

  const filteredMembers = useMemo(() => {
    if (selectedMembers.length === 0) return members;
    return members.filter((m) => selectedMembers.includes(m.id));
  }, [members, selectedMembers]);

  const filteredContributions = useMemo(() => {
    let list = contributions;

    if (selectedFY.length > 0) {
      list = list.filter((c) =>
        selectedFY.includes(new Date(c.date).getFullYear().toString())
      );
    }

    if (selectedMembers.length > 0) {
      list = list.filter((c) => selectedMembers.includes(c.memberId));
    }

    return list;
  }, [contributions, selectedFY, selectedMembers]);

  const handleExportPDF = () => {
    if (reportType === 'members') {
      generateMembersPDF(filteredMembers, selectedFields);
    } else {
      generateContributionsPDF(filteredContributions);
    }
  };

  const handleExportExcel = () => {
    if (reportType === 'members') {
      generateMembersExcel(filteredMembers, selectedFields);
    } else {
      generateContributionsExcel(filteredContributions);
    }
  };

  function formatField(value: any): string {
    if (value == null) return "—";
  
    // Arrays of primitives
    if (Array.isArray(value) && value.every(v => typeof v === "string")) {
      return value.join(", ");
    }
  
    // Address object
    if (typeof value === "object" && "street" in value) {
      const addr = value as Address;
      return [
        addr.street,
        addr.city,
        addr.state,
        addr.zip
      ].filter(Boolean).join(", ");
    }
  
    // Array of Relationship objects
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
      return value.map(r => r.type ?? "—").join(", ");
    }
  
    // Fallback for primitives
    return String(value);
  }
  
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-6">
      <Card className="w-full lg:w-80 h-fit">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Report Type */}
          <div className="space-y-2">
            <Label>Report Type</Label>
            <Select
              value={reportType}
              onValueChange={(v) => setReportType(v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64 overflow-y-auto">
                <SelectItem value="members">Member List</SelectItem>
                <SelectItem value="contributions">Contributions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Member Selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Select Members</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSelectedMembers(
                    selectedMembers.length === members.length
                      ? []
                      : members.map((m) => m.id)
                  )
                }
              >
                {selectedMembers.length === members.length
                  ? 'Clear All'
                  : 'Select All'}
              </Button>
            </div>

            <MultiSelect
              options={members.map((m) => ({
                label: `${m.firstName} ${m.lastName}`,
                value: m.id,
              }))}
              value={selectedMembers}
              onChange={setSelectedMembers}
              placeholder="All Members"
            />
          </div>

          {/* Year Selection */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Year</Label>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setSelectedFY(
                    selectedFY.length === availableYears.length
                      ? []
                      : availableYears
                  )
                }
              >
                {selectedFY.length === availableYears.length
                  ? 'Clear All'
                  : 'Select All'}
              </Button>
            </div>

            <MultiSelect
              options={availableYears.map((year) => ({
                label: year,
                value: year,
              }))}
              value={selectedFY}
              onChange={setSelectedFY}
              placeholder="All Years"
            />
          </div>

          {/* Member Fields Selection */}
          {reportType === "members" && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Fields to Export</Label>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelectedFields(
                      selectedFields.length === memberFieldOptions.length
                        ? []
                        : memberFieldOptions.map((f) => f.value)
                    )
                  }
                >
                  {selectedFields.length === memberFieldOptions.length
                    ? "Clear All"
                    : "Select All"}
                </Button>
              </div>

              <MultiSelect
                options={memberFieldOptions}
                value={selectedFields}
                onChange={setSelectedFields}
                placeholder="All Fields"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* RIGHT PANEL */}
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
                <p>Year: {selectedFY}</p>
              </>
            )}
          </div>

          {/* Preview Table (still simple for now) */}
          <div className="border rounded-md overflow-hidden">
          {reportType === 'members' ? (
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left">Name</th>
                  {selectedFields.map((f) => (
                    <th key={f} className="p-2 text-left">
                      {fieldLabelMap[f]}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="p-2">
                      {m.firstName} {m.lastName}
                    </td>

                    {selectedFields.map((f) => (
                      <td key={f} className="p-2">
                        {formatField(m[f as keyof Member])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Member</th>
                    <th className="p-2 text-left">Amount</th>
                    <th className="p-2 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContributions.map((c) => {
                    const member = members.find((m) => m.id === c.memberId);
                    return (
                      <tr key={c.id} className="border-t">
                        <td className="p-2">
                          {member
                            ? `${member.firstName} ${member.lastName}`
                            : 'Unknown'}
                        </td>
                        <td className="p-2">${c.amount.toFixed(2)}</td>
                        <td className="p-2">
                          {new Date(c.date).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
            <Button
              onClick={handleExportPDF}
              className="w-full sm:w-auto"
            >
              Export PDF
            </Button>

            <Button
              variant="secondary"
              onClick={handleExportExcel}
              className="w-full sm:w-auto"
            >
              Export Excel
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
