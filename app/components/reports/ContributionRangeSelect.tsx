import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface ContributionRangeSelectProps {
  value: 'week' | 'month' | 'year';
  onChange: (v: 'week' | 'month' | 'year') => void;
}

export function ContributionRangeSelect({
  value,
  onChange,
}: ContributionRangeSelectProps) {
  return (
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
  );
}
