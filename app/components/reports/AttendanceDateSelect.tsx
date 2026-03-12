// components/reports/AttendanceDateSelect.tsx
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import { formatDateString } from "@/app/lib/date-utils";

export function AttendanceDateSelect({
  availableDates,
  value,
  onChange,
}: {
  availableDates: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white">Date</label>

      <Select
        value={value ?? "all"}
        onValueChange={(v) => onChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="bg-black/20 border-white/20 text-white">
          <SelectValue placeholder="All Dates" />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All Dates</SelectItem>

          {availableDates.map((d) => (
            <SelectItem key={d} value={d}>
              {formatDateString(d)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
