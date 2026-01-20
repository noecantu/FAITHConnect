'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Song, SetListSongEntry } from '@/lib/types';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSongs } from '@/hooks/useSongs';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command";

import { ChevronsUpDown } from "lucide-react";

interface SetListSongEditorProps {
  songs: SetListSongEntry[];
  onChange: (songs: SetListSongEntry[]) => void;
  allSongs: Song[];
}

export function SetListSongEditor({
  songs,
  onChange,
  allSongs,
}: SetListSongEditorProps) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? allSongs.filter((s) =>
        s.title.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const addSong = (song: Song) => {
    onChange([
      ...songs,
      {
        songId: song.id,
        title: song.title,
        key: song.key,
        notes: '',
        order: 0
      },
    ]);
    setSearch('');
  };

  const removeSong = (index: number) => {
    const updated = [...songs];
    updated.splice(index, 1);
    onChange(updated);
  };

  const updateSong = (index: number, updated: Partial<SetListSongEntry>) => {
    const next = [...songs];
    next[index] = { ...next[index], ...updated };
    onChange(next);
  };

  const moveSong = (from: number, to: number) => {
    const next = [...songs];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  console.log("ALL SONGS:", allSongs);
  console.log("SET LIST SONGS:", songs);
  
  return (
    <div className="space-y-4">

      {/* Add Song Dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
          >
            Add Song
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="p-0 w-[300px]">
          <Command>
            <CommandInput placeholder="Search songs…" />

            <CommandList>
              {(allSongs ?? []).map((song) => (
                <CommandItem
                  key={song.id}
                  value={song.title}
                  onSelect={() => addSong(song)}
                >
                  {song.title}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Song List */}
      <div className="space-y-3">
        {songs.map((entry, index) => (
          <Card key={index} className="p-3 flex items-start gap-3">

            {/* Drag handle */}
            <div className="pt-1 cursor-grab">
              <GripVertical
                onClick={() => moveSong(index, Math.max(0, index - 1))}
              />
              <GripVertical
                onClick={() =>
                  moveSong(index, Math.min(songs.length - 1, index + 1))
                }
              />
            </div>

            {/* Song content */}
            <div className="flex-1 space-y-2">
              <p className="font-medium">{entry.title}</p>

              {/* Key override */}
              <div>
                <label className="text-xs text-muted-foreground">Key</label>
                <Input
                  value={entry.key}
                  onChange={(e) =>
                    updateSong(index, { key: e.target.value })
                  }
                  className="w-24"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-muted-foreground">Notes</label>
                <Input
                  value={entry.notes ?? ''}
                  onChange={(e) =>
                    updateSong(index, { notes: e.target.value })
                  }
                  placeholder="Optional notes"
                />
              </div>
            </div>

            {/* Remove */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeSong(index)}
            >
              <X />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
