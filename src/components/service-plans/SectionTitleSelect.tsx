'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const DEFAULT_SECTION_TITLES = [
  'Praise',
  'Worship',
  'Offering',
  'Altar Call',
  'Special Song',
  'Dismissal',
  'Preaching',
  'MC',
];

export function SectionTitleSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return DEFAULT_SECTION_TITLES.filter((t) =>
      t.toLowerCase().includes(q)
    );
  }, [query]);

  function handleSelect(title: string) {
    onChange(title);
    setQuery('');
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {value || 'Select Section Title'}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-3 space-y-3">
        <Input
          placeholder="Search or type custom..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim()) {
              handleSelect(query.trim());
            }
          }}
        />

        <div className="max-h-48 overflow-y-auto space-y-1">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No matches — press Enter to add
            </p>
          )}

          {filtered.map((title) => (
            <button
              key={title}
              onClick={() => handleSelect(title)}
              className="w-full text-left px-2 py-1 rounded-md hover:bg-muted transition"
            >
              {title}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
