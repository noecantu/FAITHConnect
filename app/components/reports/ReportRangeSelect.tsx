import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface ReportRangeSelectProps {
  value: 'week' | 'month' | 'year';
  onChange: (v: 'week' | 'month' | 'year') => void;
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
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
