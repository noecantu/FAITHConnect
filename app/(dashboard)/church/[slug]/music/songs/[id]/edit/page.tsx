'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { SongForm } from '@/app/components/music/SongForm';
import { useChurchId } from '@/app/hooks/useChurchId';
import { usePermissions } from '@/app/hooks/usePermissions';
import { getSongById, updateSong } from '@/app/lib/songs';
import type { Song, SongInput } from '@/app/lib/types';
import { Fab } from '@/app/components/ui/fab';
import { toast } from '@/app/hooks/use-toast';

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return 'Failed to save song.';
}

export default function EditSongPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { churchId } = useChurchId();

  // UPDATED ROLES
  const { canManageSongs, loading: permissionsLoading } = usePermissions();
  const canEdit = canManageSongs;

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');

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
        <p className="text-muted-foreground">Loading…</p>
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

  if (permissionsLoading) {
    return (
      <>
        <PageHeader title="Edit Song" />
        <p className="text-muted-foreground">Loading…</p>
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

    try {
      await updateSong(churchId, song.id, data);
      router.push(`/church/${churchId}/music/songs/${song.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: getErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Edit Song">
      </PageHeader>

      <SongForm
        mode="edit"
        initialData={song}
        onSave={handleUpdate}
        saving={saving}
        onTitleChange={setTitle}
        focusSection={(searchParams.get('section') ?? undefined) as 'lyrics' | 'chords' | undefined}
      />

      <Fab
        type="save"
        disabled={saving || !title.trim()}
        onClick={() => {
          const submitButton = document.querySelector('[data-songform-submit]');
          (submitButton as HTMLButtonElement)?.click();
        }}
      />

    </>
  );
}
