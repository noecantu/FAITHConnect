import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface ReportRangeSelectProps {
  value: 'month' | 'year';
  onChange: (v: 'month' | 'year') => void;
}

export function ReportRangeSelect({
  value,
  onChange,
}: ReportRangeSelectProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-white">
        Time Frame
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="month">Month</SelectItem>
          <SelectItem value="year">Year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
