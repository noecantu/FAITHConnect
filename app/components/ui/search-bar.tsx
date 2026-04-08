'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/app/components/ui/input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 250,
}: SearchBarProps) {
  const [internal, setInternal] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync external → internal
  useEffect(() => {
    setInternal(value);
  }, [value]);

  // Debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(internal);
    }, debounceMs);

    return () => clearTimeout(timeout);
  }, [internal, onChange, debounceMs]);

  // Cmd+K / Ctrl+K to focus
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        placeholder={placeholder}
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        className="
          w-full h-10 pr-10
          bg-black/80 border border-white/20 backdrop-blur-xl
          text-white/90 placeholder:text-white/40
          focus-visible:ring-white/20
        "
      />

      {internal && (
        <button
          onClick={() => {
            setInternal('');
            onChange('');
            inputRef.current?.focus();
          }}
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
