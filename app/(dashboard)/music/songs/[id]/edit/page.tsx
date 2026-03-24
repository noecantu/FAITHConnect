'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { SongForm } from '@/app/components/music/SongForm';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { getSongById, updateSong } from '@/app/lib/songs';
import type { Song, SongInput } from '@/app/lib/types';
import { Fab } from '@/app/components/ui/fab';

export default function EditSongPage() {
  const { id } = useParams();
  const router = useRouter();
  const { churchId } = useChurchId();

  // UPDATED ROLES
  const { canManageMusic } = useUserRoles();
  const canEdit = canManageMusic;

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!churchId || !id) return;

    const load = async () => {
      const data = await getSongById(churchId, id as string);
      setSong(data);
      setLoading(false);
    };

    load();
  }, [churchId, id]);

  if (!churchId) {
    return (
      <>
        <PageHeader title="Edit Song" />
        <p className="text-muted-foreground">Loading…</p>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <PageHeader title="Edit Song" />
        <p className="text-muted-foreground">Loading song…</p>
      </>
    );
  }

  if (!song) {
    return (
      <>
        <PageHeader title="Edit Song" />
        <p className="text-muted-foreground">Song not found.</p>
      </>
    );
  }

  if (!canEdit) {
    return (
      <>
        <PageHeader title="Edit Song" />
        <p className="text-muted-foreground">
          You do not have permission to edit songs.
        </p>
      </>
    );
  }

  const handleUpdate = async (data: SongInput) => {
    setSaving(true);

    await updateSong(churchId, song.id, {
      ...data,
    });

    router.push(`/music/songs/${song.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Song">
      </PageHeader>

      <SongForm
        mode="edit"
        initialData={song}
        onSave={handleUpdate}
        saving={saving}
      />

      <Fab
        type="save"
        disabled={saving}
        onClick={() => {
          const submitButton = document.querySelector('[data-songform-submit]');
          (submitButton as HTMLButtonElement)?.click();
        }}
      />

    </div>
  );
}
