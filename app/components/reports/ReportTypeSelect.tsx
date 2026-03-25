'use client';

import { Label } from "../ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select";

interface Props {
  value: "members" | "contributions" | "attendance";
  onChange: (v: "members" | "contributions" | "attendance") => void;
  canReadMembers: boolean;
  canReadContributions: boolean;
  canReadAttendance: boolean;
}

export function ReportTypeSelect({
  value,
  onChange,
  canReadMembers,
  canReadContributions,
  canReadAttendance,
}: Props) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Report Type</Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Report Type" />
        </SelectTrigger>

        <SelectContent>
          {canReadMembers && (
            <SelectItem value="members">Members</SelectItem>
          )}

          {canReadContributions && (
            <SelectItem value="contributions">Contributions</SelectItem>
          )}

          {canReadAttendance && (
            <SelectItem value="attendance">Attendance</SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
