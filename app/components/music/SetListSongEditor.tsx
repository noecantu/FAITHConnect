'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Song, SetListSongEntry } from '../../lib/types';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

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
  const [showList, setShowList] = useState(false);

  const filtered = allSongs.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const addSong = (song: Song) => {
    onChange([
      ...songs,
      {
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
    if (to < 0 || to >= songs.length) return;
    const updated = [...songs];
    const item = updated.splice(from, 1)[0];
    updated.splice(to, 0, item);
    onChange(updated);
  };

  return (
    <div className="space-y-4">

      {/* Search */}
      <div className="relative">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setShowList(true)}
          onBlur={() => setTimeout(() => setShowList(false), 150)}
          placeholder="Add song…"
        />

        {showList && filtered.length > 0 && (
          <Card className="absolute z-10 w-full mt-1 p-2 space-y-1 max-h-48 overflow-y-auto">
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
          <SongItem
            key={entry.songId}
            entry={entry}
            index={index}
            isFirst={index === 0}
            isLast={index === songs.length - 1}
            onRemove={() => removeSong(index)}
            onUpdate={(updated) => updateSong(index, updated)}
            onMoveUp={() => moveSong(index, index - 1)}
            onMoveDown={() => moveSong(index, index + 1)}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------
   Song Item Component (no DnD)
---------------------------------------------- */

function SongItem({
  entry,
  index,
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

        {/* Key override */}
        <div>
          <label className="text-xs text-muted-foreground">Key</label>
          <Input
            value={entry.key}
            onChange={(e) => onUpdate({ key: e.target.value })}
            className="w-24"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs text-muted-foreground">Notes</label>
          <Input
            value={entry.notes ?? ''}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Optional notes"
          />
        </div>
      </div>

      {/* Remove */}
      <Button variant="outline" size="icon" onClick={onRemove}>
        <X />
      </Button>
    </Card>
  );
}
