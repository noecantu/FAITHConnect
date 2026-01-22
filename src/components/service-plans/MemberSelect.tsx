'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';

import type { Member } from '@/lib/types';

interface Props {
  members: Member[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function MemberSelect({ members, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedMember = members.find((m) => m.id === value);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return members.filter((m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
    );
  }, [members, query]);

  function handleSelect(id: string) {
    onChange(id);
    setQuery('');
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
        >
          {selectedMember
            ? `${selectedMember.firstName} ${selectedMember.lastName}`
            : 'Select Member'}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-3 space-y-3">
        <Input
          placeholder="Search members..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="max-h-48 overflow-y-auto space-y-1">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No members found</p>
          )}

          {filtered.map((member) => (
            <button
              key={member.id}
              onClick={() => handleSelect(member.id)}
              className="
                w-full text-left px-2 py-1 rounded-md
                hover:bg-muted transition
              "
            >
              <div className="font-medium">
                {member.firstName} {member.lastName}
              </div>
              {member.status && (
                <div className="text-xs text-muted-foreground">
                  {member.status}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Clear selection */}
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => onChange(null)}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
