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

import { generateMembersPDF, generateMembersExcel, generateContributionsPDF, generateContributionsExcel } from '@/lib/reports';

export default function ReportsPage() {
  const { members } = useMembers();
  const { contributions } = useContributions();

  // Report type
  const [reportType, setReportType] = useState<'members' | 'contributions'>(
    'members'
  );

  // Member selection
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Year selection
  const [selectedFY, setSelectedFY] = useState<string>('all');

  // ---------------------------------------
  // AVAILABLE YEARS (dynamic from data)
  // ---------------------------------------
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    contributions.forEach((c) => {
      years.add(new Date(c.date).getFullYear().toString());
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [contributions]);

  // ---------------------------------------
  // FILTERED MEMBERS
  // ---------------------------------------
  const filteredMembers = useMemo(() => {
    if (selectedMembers.length === 0) return members;
    return members.filter((m) => selectedMembers.includes(m.id));
  }, [members, selectedMembers]);

  // ---------------------------------------
  // FILTERED CONTRIBUTIONS
  // ---------------------------------------
  const filteredContributions = useMemo(() => {
    let list = contributions;

    // Filter by year
    if (selectedFY !== 'all') {
      list = list.filter(
        (c) => new Date(c.date).getFullYear().toString() === selectedFY
      );
    }

    // Filter by selected members
    if (selectedMembers.length > 0) {
      list = list.filter((c) => selectedMembers.includes(c.memberId));
    }

    return list;
  }, [contributions, selectedFY, selectedMembers]);

  // ---------------------------------------
  // EXPORT HANDLERS
  // ---------------------------------------
  const handleExportPDF = () => {
    if (reportType === 'members') {
      generateMembersPDF(filteredMembers);
    } else {
      generateContributionsPDF(filteredContributions);
    }
  };

  const handleExportExcel = () => {
    if (reportType === 'members') {
      generateMembersExcel(filteredMembers);
    } else {
      generateContributionsExcel(filteredContributions);
    }
  };

  // ---------------------------------------
  // FY CHANGE HANDLER (handles "Select All Years")
  // ---------------------------------------
  const handleFYChange = (value: string) => {
    if (value === 'select-all-years') {
      setSelectedFY('all');
      return;
    }
    setSelectedFY(value);
  };

  return (
    <div className="flex gap-6 p-6">
      {/* LEFT PANEL */}
      <Card className="w-80 h-fit">
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
              <SelectContent>
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
            <Label>Year</Label>
            <Select value={selectedFY} onValueChange={handleFYChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">Show All</SelectItem>
                <SelectItem value="select-all-years">Select All Years</SelectItem>

                {availableYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* RIGHT PANEL */}
      <Card className="flex-1">
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

          <Separator />

          <div className="flex gap-4">
            <Button onClick={handleExportPDF}>Export PDF</Button>
            <Button variant="secondary" onClick={handleExportExcel}>
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
