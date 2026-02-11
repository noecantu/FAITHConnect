'use client';

import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { MultiSelect } from "../ui/multi-select";

interface Option {
  label: string;
  value: string;
}

interface Props {
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
}

export function StatusSelect({ options, value, onChange }: Props) {
  const allValues = options.map((o) => o.value);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>Status</Label>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(value.length === 0 ? allValues : [])}
        >
          {value.length === 0 ? "Select All" : "Clear All"}
        </Button>
      </div>

      <MultiSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder="All Status"
      />
    </div>
  );
}
