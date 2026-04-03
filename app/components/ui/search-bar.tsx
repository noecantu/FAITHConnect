'use client';

import { X } from 'lucide-react';
import { Input } from '@/app/components/ui/input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  return (
    <div className="relative w-full">
      <Input
        placeholder={placeholder ?? "Search..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full h-10 pr-10
          bg-black/40 border border-white/30 backdrop-blur-xl
          text-white/90 placeholder:text-white/40
          focus-visible:ring-white/20
        "
      />

      {value && (
        <button
          onClick={() => onChange('')}
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            text-white/60 hover:text-white/90 transition
          "
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
