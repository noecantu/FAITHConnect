'use client';

import { useState } from 'react';
import { Button } from './button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from './popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
} from './command';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

type Option = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
        >
          {value.length === 0
            ? placeholder
            : `${value.length} selected`}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="p-0 w-full">
        <Command>
          <CommandInput placeholder="Search..." />

          {/* Scrollable list */}
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandGroup>
              {options.map((opt) => {
                const selected = value.includes(opt.value);

                return (
                  <CommandItem
                    key={opt.value}
                    onSelect={() => toggle(opt.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
