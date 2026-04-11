'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { Song, SetListSongEntry } from '@/app/lib/types';
import { ensureSongEntryIds, generateId } from '@/app/lib/utils/id';

interface Props {
  sectionId: string;
  songs: SetListSongEntry[];
  onChange: (songs: SetListSongEntry[]) => void;
  allSongs: Song[];
}

export function SectionSongList({
  songs,
  onChange,
  allSongs,
}: Props) {
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(false);

  const normalized = ensureSongEntryIds(songs);

  const filtered = allSongs.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const addSong = (song: Song) => {
    onChange([
      ...normalized,
      {
        id: generateId(),
        songId: song.id,
        title: song.title,
        key: song.key,
        bpm: song.bpm,
        timeSignature: song.timeSignature,
        notes: '',
      },
    ]);
    setSearch('');
    setShowList(false);
  };

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

      {/* Search */}
      {/* <div className="relative">
        <Input
          placeholder="Search songs to add..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowList(true);
          }}
        />

        {showList && search.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-60 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground">
                No songs found
              </div>
            )}

            {filtered.map((song) => (
              <button
                key={song.id}
                className="w-full text-left p-3 hover:bg-muted/50 transition-colors"
                onClick={() => addSong(song)}
              >
                <div className="font-medium">{song.title}</div>
                <div className="text-xs text-muted-foreground">
                  Key: {song.key ?? '—'} • BPM: {song.bpm ?? '—'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div> */}

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
   Song Item
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
    <Card className="p-4 flex items-start gap-4 border border-border bg-card">

      {/* Move Up/Down */}
      <div className="flex flex-col gap-1 pt-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isFirst}
          onClick={onMoveUp}
          className="h-7 w-7"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isLast}
          onClick={onMoveDown}
          className="h-7 w-7"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Song content */}
      <div className="flex-1 space-y-2">
        <p className="font-medium text-foreground">{entry.title}</p>

        <div className="text-xs text-muted-foreground flex gap-4">
          <span>Key: {entry.key ?? '—'}</span>
          <span>BPM: {entry.bpm ?? '—'}</span>
          <span>Time: {entry.timeSignature ?? '—'}</span>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Notes</label>
          <Input
            value={entry.notes ?? ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Optional notes"
          />
        </div>
      </div>

      {/* Remove */}
      <Button
        variant="outline"
        size="icon"
        onClick={onRemove}
        className="h-8 w-8"
      >
        <X className="h-4 w-4" />
      </Button>
    </Card>
  );
}