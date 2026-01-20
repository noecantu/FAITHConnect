'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Song, SetListSongEntry } from '@/lib/types';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSongs } from '@/hooks/useSongs';

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
        order: 0,
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

  return (
    <div className="space-y-4">

      {/* Search */}
      <div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search songs to add…"
        />

        {filtered.length > 0 && (
          <Card className="mt-2 p-2 space-y-1 max-h-48 overflow-y-auto">
            {filtered.map((song) => (
              <button
                key={song.id}
                className="w-full text-left px-2 py-1 hover:bg-accent rounded"
                onClick={() => addSong(song)}
              >
                {song.title}
              </button>
            ))}
          </Card>
        )}
      </div>

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
