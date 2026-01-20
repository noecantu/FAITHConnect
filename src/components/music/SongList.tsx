'use client';

import { Card } from '@/components/ui/card';
import { Song } from '@/lib/types';
import { SongEditorDialog } from './SongEditorDialog';
import { SongDeleteDialog } from './SongDeleteDialog';
import { Button } from '../ui/button';

export function SongList({
  songs,
  loading,
  canManage,
}: {
  songs: Song[];
  loading: boolean;
  canManage: boolean;
}) {
  if (loading) {
    return <p className="text-muted-foreground">Loading songs…</p>;
  }

  if (songs.length === 0) {
    return <p className="text-muted-foreground">No songs found.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {songs.map((song) => (
        <Card key={song.id} className="p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold">{song.title}</p>
            {song.artist && (
              <p className="text-sm text-muted-foreground">{song.artist}</p>
            )}
          </div>

          {canManage && (
            <div className="flex gap-2">
              <SongEditorDialog mode="edit" song={song}>
                <Button variant="outline" size="sm">Edit</Button>
              </SongEditorDialog>

              <SongDeleteDialog song={song} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
