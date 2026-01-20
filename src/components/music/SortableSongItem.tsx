'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { SetListSongEntry, Song } from '@/lib/types';

interface SortableSongItemProps {
  entry: SetListSongEntry;
  allSongs: Song[];
  onChange: (updated: SetListSongEntry) => void;
  onRemove: () => void;
}

export function SortableSongItem({
  entry,
  allSongs,
  onChange,
  onRemove,
}: SortableSongItemProps) {
  const song = allSongs.find((s) => s.id === entry.songId);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: entry.songId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab text-muted-foreground"
          >
            ☰
          </div>
          <p className="font-semibold">{song?.title}</p>
        </div>

        <Button variant="destructive" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div>
          <Label>Key</Label>
          <Input
            value={entry.key}
            onChange={(e) => onChange({ ...entry, key: e.target.value })}
          />
        </div>

        <div>
          <Label>Notes</Label>
          <Input
            value={entry.notes ?? ''}
            onChange={(e) => onChange({ ...entry, notes: e.target.value })}
          />
        </div>
      </div>
    </Card>
  );
}
