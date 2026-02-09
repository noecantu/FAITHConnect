"use client";

import { Label } from "@/app/components/ui/label";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function TimezoneSelect({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label>Timezone</Label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full rounded-md border border-input bg-background
          px-3 py-2 text-sm
          h-10
          focus:outline-none focus:ring-2 focus:ring-primary
        "
      >
        <option value="">Select a timezone</option>

        <optgroup label="United States">
          <option value="America/New_York">Eastern (ET)</option>
          <option value="America/Chicago">Central (CT)</option>
          <option value="America/Denver">Mountain (MT)</option>
          <option value="America/Los_Angeles">Pacific (PT)</option>
          <option value="America/Phoenix">Arizona (No DST)</option>
          <option value="America/Anchorage">Alaska</option>
          <option value="Pacific/Honolulu">Hawaii</option>
        </optgroup>

        <optgroup label="International">
          <option value="Europe/London">London (UK)</option>
          <option value="Europe/Paris">Paris (France)</option>
          <option value="Europe/Berlin">Berlin (Germany)</option>
          <option value="Asia/Tokyo">Tokyo (Japan)</option>
          <option value="Asia/Singapore">Singapore</option>
          <option value="Australia/Sydney">Sydney (Australia)</option>
        </optgroup>
      </select>
    </div>
  );
}
