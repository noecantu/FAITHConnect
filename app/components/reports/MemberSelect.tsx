'use client';

import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { MultiSelect } from "@/app/components/ui/multi-select";
import { Member } from "@/app/lib/types";
import React from "react";

interface Props {
  members: Member[];
  options?: Array<{ label: string; value: string }>;
  value: string[];
  onChange: (v: string[]) => void;
}

export function MemberSelect({ members, options, value, onChange }: Props) {
  const computedOptions = React.useMemo(() => {
    if (options && options.length > 0) {
      return options;
    }

    return [...members]
      .sort((a, b) => {
        const lastA = a.lastName.toLowerCase();
        const lastB = b.lastName.toLowerCase();

        if (lastA < lastB) return -1;
        if (lastA > lastB) return 1;

        const firstA = a.firstName.toLowerCase();
        const firstB = b.firstName.toLowerCase();

        if (firstA < firstB) return -1;
        if (firstA > firstB) return 1;

        return 0;
      })
      .map((m) => ({
        label: `${m.firstName} ${m.lastName}`,
        value: m.id,
      }));
  }, [members, options]);

  const allIds = computedOptions.map((option) => option.value);

  return (
    <div className="space-y-0">
      <div className="flex justify-between items-center">
        <Label>Select Members</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(value.length > 0 ? [] : allIds)}
        >
          {value.length > 0 ? "Clear All" : "Select All"}
        </Button>
      </div>

      <MultiSelect
        options={computedOptions}
        value={value}
        onChange={onChange}
        placeholder="No Members Selected"
      />
    </div>
  );
}

