'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Song } from '@/app/lib/types';

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  songs: Song[];
  onSelect: (songId: string) => void;
}

export default function SongSelectionDialog({
  isOpen,
  onOpenChange,
  songs,
  onSelect,
}: Props) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'key' | 'bpm' | 'time'>('title');

  const normalizeKey = (key: string) =>
    key.replace('♭', 'b').replace('♯', '#');

  const timeWeight = (ts?: string) => {
    if (!ts) return 0;
    const [top, bottom] = ts.split('/').map(Number);
    return top / bottom;
  };

  const filtered = useMemo(() => {
    let list = songs.filter((s) =>
      s.title.toLowerCase().includes(search.toLowerCase())
    );

    switch (sortBy) {
      case 'title':
        list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'key':
        list = [...list].sort((a, b) =>
          normalizeKey(a.key).localeCompare(normalizeKey(b.key))
        );
        break;
      case 'bpm':
        list = [...list].sort((a, b) => (a.bpm ?? 0) - (b.bpm ?? 0));
        break;
      case 'time':
        list = [...list].sort(
          (a, b) => timeWeight(a.timeSignature) - timeWeight(b.timeSignature)
        );
        break;
    }

    return list;
  }, [songs, search, sortBy]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Song</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Search or sort to find a song.
          </p>
        </DialogHeader>

        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Search songs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="key">Key</SelectItem>
              <SelectItem value="bpm">Tempo</SelectItem>
              <SelectItem value="time">Signature</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 max-h-80 overflow-y-auto space-y-2">
          {filtered.map((song) => (
            <button
              key={song.id}
              className="w-full text-left px-3 py-2 rounded hover:bg-accent flex justify-between"
              onClick={() => {
                onSelect(song.id);
                onOpenChange(false);
              }}
            >
              <div>
                <div className="font-medium">{song.title}</div>
                <div className="text-xs text-muted-foreground">
                  Key: {song.key} • BPM: {song.bpm ?? '—'} • Time: {song.timeSignature ?? '—'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
