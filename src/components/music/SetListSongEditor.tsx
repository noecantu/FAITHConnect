'use client';

import { useState } from 'react';
import { updateSetList } from '@/lib/setlists';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { arrayMove } from '@dnd-kit/sortable';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableSongItem } from './SortableSongItem';

import type { SetList, SetListSongEntry, Song } from '@/lib/types';

interface SetListSongEditorProps {
  setList: SetList;
  allSongs: Song[];
  churchId: string;
  onSongsChange?: (songs: SetListSongEntry[]) => void;
}

export function SetListSongEditor({
  setList,
  allSongs,
  churchId,
  onSongsChange,
}: SetListSongEditorProps) {
  const [songs, setSongs] = useState<SetListSongEntry[]>(setList.songs);
  const [search, setSearch] = useState('');

  const sensors = useSensors(useSensor(PointerSensor));

  // Unified update function (internal + parent)
  const updateSongs = (updater: (prev: SetListSongEntry[]) => SetListSongEntry[]) => {
    setSongs((prev) => {
      const next = updater(prev);
      if (onSongsChange) onSongsChange(next);
      return next;
    });
  };

  const filteredSongs = allSongs.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddSong = (song: Song) => {
    const newEntry: SetListSongEntry = {
      songId: song.id,
      key: song.key,
      order: songs.length,
      notes: '',
    };

    updateSongs((prev) => [...prev, newEntry]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = songs.findIndex((s) => s.songId === active.id);
    const newIndex = songs.findIndex((s) => s.songId === over.id);

    const reordered = arrayMove(songs, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i,
    }));

    updateSongs(() => reordered);
  };

  const handleSave = async () => {
    await updateSetList(churchId, setList.id, { songs });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Song Search */}
      <Card className="p-4">
        <Label>Search Songs</Label>
        <Input
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredSongs.map((song) => (
            <Button
              key={song.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleAddSong(song)}
            >
              {song.title}
            </Button>
          ))}
        </div>
      </Card>

      {/* Set List Songs */}
      <Card className="p-4">
        <Label>Set List Songs</Label>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={songs.map((s) => s.songId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 mt-4">
              {songs.map((entry) => (
                <SortableSongItem
                  key={entry.songId}
                  entry={entry}
                  allSongs={allSongs}
                  onChange={(updated) => {
                    updateSongs((prev) =>
                      prev.map((s) =>
                        s.songId === entry.songId ? updated : s
                      )
                    );
                  }}
                  onRemove={() => {
                    updateSongs((prev) =>
                      prev
                        .filter((s) => s.songId !== entry.songId)
                        .map((s, i) => ({ ...s, order: i }))
                    );
                  }}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button className="mt-4" onClick={handleSave}>
          Save Changes
        </Button>
      </Card>
    </div>
  );
}
