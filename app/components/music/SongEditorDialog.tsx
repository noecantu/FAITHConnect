'use client';

import { useState } from 'react';
import { Dialog, DialogTrigger } from '../ui/dialog';
import { StandardDialogLayout } from '../layout/StandardDialogLayout';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { createSong, updateSong } from '../../lib/songs';
import { useChurchId } from '../../hooks/useChurchId';
import { Song } from '../../lib/types';

export function SongEditorDialog({
  children,
  mode,
  song,
}: {
  children: React.ReactNode;
  mode: 'create' | 'edit';
  song?: Song;
}) {
  const churchId = useChurchId();
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState(song?.title ?? '');
  const [artist, setArtist] = useState(song?.artist ?? '');
  const [key, setKey] = useState(song?.key ?? 'G');

  const handleSave = async () => {
    if (!churchId) return;

    if (mode === 'create') {
      await createSong(churchId, {
        title,
        artist,
        key,
        createdBy: 'system',
        tags: []
      });
    } else {
      await updateSong(churchId, song!.id, {
        title,
        artist,
        key,
      });
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <StandardDialogLayout
        title={mode === 'create' ? 'Add Song' : 'Edit Song'}
        description="Manage song details."
        onClose={() => setOpen(false)}
        footer={
          <Button onClick={handleSave}>
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label>Artist</Label>
            <Input value={artist} onChange={(e) => setArtist(e.target.value)} />
          </div>

          <div>
            <Label>Key</Label>
            <Input value={key} onChange={(e) => setKey(e.target.value)} />
          </div>
        </div>
      </StandardDialogLayout>
    </Dialog>
  );
}
