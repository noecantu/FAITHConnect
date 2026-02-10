'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '../../../../components/page-header';
import { SongForm } from '../../../../components/music/SongForm';
import { useChurchId } from '../../../../hooks/useChurchId';
import { useUserRoles } from '../../../../hooks/useUserRoles';
import { getSongById, updateSong } from '../../../../lib/songs';
import type { Song, SongInput } from '../../../../lib/types';
import { Fab } from '../../../../components/ui/fab';

export default function EditSongPage() {
  const { id } = useParams();
  const router = useRouter();
  const churchId = useChurchId();

  // UPDATED ROLES
  const { isAdmin, isMusicManager } = useUserRoles(churchId);
  const canEdit = isAdmin || isMusicManager;

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
      <div className="p-6">
        <PageHeader title="Edit Song" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Edit Song" />
        <p className="text-muted-foreground">Loading song…</p>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="p-6">
        <PageHeader title="Edit Song" />
        <p className="text-muted-foreground">Song not found.</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-6">
        <PageHeader title="Edit Song" />
        <p className="text-muted-foreground">
          You do not have permission to edit songs.
        </p>
      </div>
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
