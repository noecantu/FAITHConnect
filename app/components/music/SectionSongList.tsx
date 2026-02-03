'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { GripVertical, X } from 'lucide-react';
import { Song, SetListSongEntry } from '../../lib/types';

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
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

import { CSS } from '@dnd-kit/utilities';

interface Props {
  sectionId: string;
  songs: SetListSongEntry[];
  onChange: (songs: SetListSongEntry[]) => void;
  allSongs: Song[];
}

export function SectionSongList({
  sectionId,
  songs,
  onChange,
  allSongs,
}: Props) {
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

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
  };

  const removeSong = (songId: string) => {
    onChange(songs.filter((s) => s.songId !== songId));
  };

  const updateSong = (songId: string, updated: Partial<SetListSongEntry>) => {
    onChange(
      songs.map((s) => (s.songId === songId ? { ...s, ...updated } : s))
    );
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

    onChange(arrayMove(songs, oldIndex, newIndex));
  };

  return (
    <div className="space-y-3">

      {/* Search to add songs */}
      <div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setShowList(true)}
          onBlur={() => setTimeout(() => setShowList(false), 150)} // allow clicking
          placeholder="Add song to this section…"
        />

        {showList && filtered.length > 0 && (
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

      {/* Song list */}
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
                onRemove={() => removeSong(entry.songId)}
                onUpdate={(updated) => updateSong(entry.songId, updated)}
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
   Sortable Song Item
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
