'use client';

import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { Song, SetListSongEntry } from '@/app/lib/types';
import { ensureSongEntryIds } from '@/app/lib/utils/id';

interface Props {
  sectionId: string;
  songs: SetListSongEntry[];
  onChange: (songs: SetListSongEntry[]) => void;
  allSongs: Song[];
}

export function SectionSongList({
  songs,
  onChange,
}: Props) {
  // Normalize incoming songs to ensure stable IDs
  const normalized = ensureSongEntryIds(songs);

  const removeSong = (id: string) => {
    onChange(normalized.filter((s) => s.id !== id));
  };

  const updateSong = (id: string, updated: Partial<SetListSongEntry>) => {
    onChange(
      normalized.map((s) => (s.id === id ? { ...s, ...updated } : s))
    );
  };

  const moveSong = (from: number, to: number) => {
    if (to < 0 || to >= normalized.length) return;
    const updated = [...normalized];
    const item = updated.splice(from, 1)[0];
    updated.splice(to, 0, item);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Song list */}
      <div className="space-y-3">
        {normalized.map((entry, index) => (
          <SongItem
            key={entry.id}
            entry={entry}
            index={index}
            isFirst={index === 0}
            isLast={index === normalized.length - 1}
            onRemove={() => removeSong(entry.id)}
            onUpdate={(updated) => updateSong(entry.id, updated)}
            onMoveUp={() => moveSong(index, index - 1)}
            onMoveDown={() => moveSong(index, index + 1)}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------
   Song Item (Up/Down arrows, no DnD)
---------------------------------------------- */

function SongItem({
  entry,
  isFirst,
  isLast,
  onRemove,
  onUpdate,
  onMoveUp,
  onMoveDown,
}: {
  entry: SetListSongEntry;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onRemove: () => void;
  onUpdate: (updated: Partial<SetListSongEntry>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <Card className="p-3 flex items-start gap-3">

      {/* Move Up/Down */}
      <div className="flex flex-col gap-1 pt-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isFirst}
          onClick={onMoveUp}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isLast}
          onClick={onMoveDown}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Song content */}
      <div className="flex-1 space-y-2">
        <p className="font-medium">{entry.title}</p>

        <div className="text-xs text-muted-foreground flex gap-4">
          <span>Key: {entry.key ?? '—'} • {entry.bpm ?? '—'} BPM • {entry.timeSignature ?? '—'} Time</span>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Notes</label>
          <Input
            value={entry.notes ?? ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Optional notes"
          />
        </div>
      </div>

      <Button variant="outline" size="icon" onClick={onRemove}>
        <X />
      </Button>
    </Card>
  );
}