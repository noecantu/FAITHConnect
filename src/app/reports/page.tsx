'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useMembers } from '@/hooks/use-members';
import { useContributions } from '@/hooks/use-contributions';
import { useSettings } from '@/hooks/use-settings';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Member } from '@/lib/types';

export default function ReportsPage() {
  const { members } = useMembers();
  const { contributions } = useContributions();
  const { fiscalYear } = useSettings();

  // Report type
  const [reportType, setReportType] = useState<'members' | 'contributions'>('members');

  // Member selection
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Financial year override
  const [selectedFY, setSelectedFY] = useState<string>('use-app-setting');

  // Field selection (for member exports)
  const [selectedFields, setSelectedFields] = useState<(keyof Member)[]>([]);

  const memberFields: { key: keyof Member; label: string }[] = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'status', label: 'Status' },
    { key: 'address', label: 'Address' },
    { key: 'birthday', label: 'Birthday' },
    { key: 'baptismDate', label: 'Baptism Date' },
    { key: 'anniversary', label: 'Anniversary' },
    { key: 'roles', label: 'Roles' },
    { key: 'notes', label: 'Notes' },
  ];  

  // Filtered members
  const filteredMembers = useMemo(() => {
    if (!selectedMembers.length) return members;
    return members.filter((m) => selectedMembers.includes(m.id));
  }, [members, selectedMembers]);

  // Filtered contributions
  const filteredContributions = useMemo(() => {
    const fy = selectedFY === 'use-app-setting' ? fiscalYear : selectedFY;
  
    if (fy === 'all') return contributions;
  
    return contributions.filter((c) =>
      new Date(c.date).getFullYear().toString() === fy
    );
  }, [contributions, selectedFY, fiscalYear]);  

  // Mapped members for export
  const mappedMembers = useMemo(() => {
    return filteredMembers.map((m) => {
      const obj: any = {};
      selectedFields.forEach((f) => (obj[f] = m[f]));
      return obj;
    });
  }, [filteredMembers, selectedFields]);  

  const handleExportPDF = () => {
    if (reportType === 'members') {
      console.log('Exporting Members PDF:', mappedMembers);
    } else {
      console.log('Exporting Contributions PDF:', filteredContributions);
    }
  };

  const handleExportExcel = () => {
    if (reportType === 'members') {
      console.log('Exporting Members Excel:', mappedMembers);
    } else {
      console.log('Exporting Contributions Excel:', filteredContributions);
    }
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
            <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
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
          {reportType === 'members' && (
            <div className="space-y-2">
              <Label>Select Members</Label>
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
          )}

          {/* Financial Year */}
          <div className="space-y-2">
            <Label>Financial Year</Label>
            <Select value={selectedFY} onValueChange={setSelectedFY}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="use-app-setting">
                  Use App Setting ({fiscalYear})
                </SelectItem>
                <SelectItem value="all">Show All</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          {reportType === 'members' && (
            <div className="space-y-2">
              <Label>Fields to Include</Label>
              <div className="space-y-1">
                {memberFields.map((f) => (
                  <div key={f.key} className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedFields.includes(f.key)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedFields([...selectedFields, f.key]);
                        } else {
                          setSelectedFields(selectedFields.filter((x) => x !== f.key));
                        }
                      }}
                    />
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              <>
                <p>Members Selected: {filteredMembers.length}</p>
                <p>Fields: {selectedFields.join(', ')}</p>
              </>
            ) : (
              <>
                <p>Contributions: {filteredContributions.length}</p>
                <p>Financial Year: {selectedFY === 'use-app-setting' ? fiscalYear : selectedFY}</p>
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
