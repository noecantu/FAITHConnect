'use client';

import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { MultiSelect } from "../ui/multi-select";
import { Member } from "@/app/lib/types";
import React from "react";

interface Props {
  members: Member[];
  value: string[];
  onChange: (v: string[]) => void;
}

export function MemberSelect({ members, value, onChange }: Props) {
  const allIds = members.map((m) => m.id);

  const sortedMembers = React.useMemo(() => {
    return [...members].sort((a, b) => {
      const lastA = a.lastName.toLowerCase();
      const lastB = b.lastName.toLowerCase();

      if (lastA < lastB) return -1;
      if (lastA > lastB) return 1;

      const firstA = a.firstName.toLowerCase();
      const firstB = b.firstName.toLowerCase();

      if (firstA < firstB) return -1;
      if (firstA > firstB) return 1;

      return 0;
    });
  }, [members]);

  return (
    <div className="space-y-2">
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
        options={sortedMembers.map((m) => ({
          label: `${m.firstName} ${m.lastName}`,
          value: m.id,
        }))}
        value={value}
        onChange={onChange}
        placeholder="No Members Selected"
      />
    </div>
  );
}

