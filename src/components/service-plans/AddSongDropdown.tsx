'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';

import type { Song } from '@/lib/types';

interface Props {
  songs: Song[];
  onSelect: (songId: string) => void;
}

export function AddSongDropdown({ songs, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return songs.filter((s) => s.title.toLowerCase().includes(q));
  }, [songs, query]);

  function handleSelect(songId: string) {
    onSelect(songId);
    setQuery('');
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          Add Song
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
      </PopoverContent>
    </Popover>
  );
}
