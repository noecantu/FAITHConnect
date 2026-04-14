"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";
import { SelectGroup, SelectLabel } from "@radix-ui/react-select";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function TimezoneSelect({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className="
          w-full h-10 px-3 rounded-md border border-white/20
          bg-black/40 text-sm text-white
        "
      >
        <SelectValue placeholder="Select a timezone" />
      </SelectTrigger>

      <SelectContent className="bg-black/90 text-white border-white/20">
        <SelectGroup>
          <SelectLabel>United States</SelectLabel>
          <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
          <SelectItem value="America/Chicago">Central (CT)</SelectItem>
          <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
          <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
          <SelectItem value="America/Phoenix">Arizona (No DST)</SelectItem>
          <SelectItem value="America/Anchorage">Alaska</SelectItem>
          <SelectItem value="Pacific/Honolulu">Hawaii</SelectItem>
        </SelectGroup>

        <SelectGroup>
          <SelectLabel>International</SelectLabel>
          <SelectItem value="Europe/London">London (UK)</SelectItem>
          <SelectItem value="Europe/Paris">Paris (France)</SelectItem>
          <SelectItem value="Europe/Berlin">Berlin (Germany)</SelectItem>
          <SelectItem value="Asia/Tokyo">Tokyo (Japan)</SelectItem>
          <SelectItem value="Asia/Singapore">Singapore</SelectItem>
          <SelectItem value="Australia/Sydney">Sydney (Australia)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}