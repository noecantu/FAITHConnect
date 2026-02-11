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

export function MemberFieldSelect({ options, value, onChange }: Props) {
  const allValues = options.map((o) => o.value);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>Fields to Export</Label>

        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            onChange(value.length === options.length ? [] : allValues)
          }
        >
          {value.length === options.length ? "Clear All" : "Select All"}
        </Button>
      </div>

      <MultiSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder="All Fields"
      />
    </div>
  );
}
