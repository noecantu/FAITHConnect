'use client';

import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { MultiSelect } from "../ui/multi-select";

interface Props {
  years: string[];
  value: string[];
  onChange: (v: string[]) => void;
}

export function YearSelect({ years, value, onChange }: Props) {
  const allYears = years;

  const placeholder =
    value.length === 0
      ? "No Year Selected"
      : value.length === allYears.length
      ? "All Years"
      : value.join(", ");

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>Year</Label>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(value.length === 0 ? allYears : [])}
        >
          {value.length === 0 ? "Select All" : "Clear All"}
        </Button>
      </div>

      <MultiSelect
        options={allYears.map((year) => ({
          label: year,
          value: year,
        }))}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
