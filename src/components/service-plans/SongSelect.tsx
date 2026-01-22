'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';

import type { Song } from '@/lib/types';

interface Props {
  songs: Song[];
  value: string | null;
  onChange: (value: string | null) => void;
}

export function SongSelect({ songs, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedSong = songs.find((s) => s.id === value);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return songs.filter((s) => s.title.toLowerCase().includes(q));
  }, [songs, query]);

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
          {selectedSong ? selectedSong.title : 'Select Song'}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-3 space-y-3">
        <Input
          placeholder="Search songs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="max-h-48 overflow-y-auto space-y-1">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No songs found</p>
          )}

          {filtered.map((song) => (
            <button
              key={song.id}
              onClick={() => handleSelect(song.id)}
              className="
                w-full text-left px-2 py-1 rounded-md
                hover:bg-muted transition
              "
            >
              <div className="font-medium">{song.title}</div>
              {song.key && (
                <div className="text-xs text-muted-foreground">
                  Key: {song.key}
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
