'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Song, SetListSongEntry } from '@/lib/types';
import { X, GripVertical } from 'lucide-react';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';

import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

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
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

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

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = songs.findIndex((s) => s.songId === active.id);
    const newIndex = songs.findIndex((s) => s.songId === over.id);

    const reordered = arrayMove(songs, oldIndex, newIndex);
    onChange(reordered);
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

      {/* Drag + Drop Song List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={songs.map((s) => s.songId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {songs.map((entry) => (
              <SortableSongItem
                key={entry.songId}
                entry={entry}
                onRemove={() =>
                  removeSong(songs.findIndex((s) => s.songId === entry.songId))
                }
                onUpdate={(updated) =>
                  updateSong(
                    songs.findIndex((s) => s.songId === entry.songId),
                    updated
                  )
                }
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <Card className="p-3 flex items-start gap-3 opacity-80">
              <GripVertical className="cursor-grabbing" />
              <div className="flex-1 space-y-2">
                <p className="font-medium">
                  {songs.find((s) => s.songId === activeId)?.title}
                </p>
              </div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/* ---------------------------------------------
   Sortable Song Item Component
---------------------------------------------- */

function SortableSongItem({
  entry,
  onRemove,
  onUpdate,
}: {
  entry: SetListSongEntry;
  onRemove: () => void;
  onUpdate: (updated: Partial<SetListSongEntry>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: entry.songId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-3 flex items-start gap-3"
    >
      {/* Drag handle */}
      <GripVertical
        {...attributes}
        {...listeners}
        className="cursor-grab mt-1 text-muted-foreground"
      />

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
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <X />
      </Button>
    </Card>
  );
}
