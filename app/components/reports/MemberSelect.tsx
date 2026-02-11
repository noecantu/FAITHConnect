'use client';

import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { MultiSelect } from "../ui/multi-select";
import { Member } from "../../lib/types";

interface Props {
  members: Member[];
  value: string[];
  onChange: (v: string[]) => void;
}

export function MemberSelect({ members, value, onChange }: Props) {
  const allIds = members.map((m) => m.id);

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
        options={members.map((m) => ({
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
