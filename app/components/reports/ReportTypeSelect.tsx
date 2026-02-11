'use client';

import { Label } from "../ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select";

interface Props {
  value: 'members' | 'contributions';
  onChange: (v: 'members' | 'contributions') => void;
}

export function ReportTypeSelect({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label>Report Type</Label>

      <Select
        value={value}
        onValueChange={(v) => onChange(v as typeof value)}
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
  );
}
