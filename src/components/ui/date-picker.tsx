'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date" }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          {value ? format(value, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(d) => {
            onChange(d ?? null);
            setOpen(false); // ← ensures the calendar closes
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
