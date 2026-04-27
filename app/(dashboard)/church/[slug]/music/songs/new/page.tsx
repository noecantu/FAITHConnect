'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { SongForm } from '@/app/components/music/SongForm';
import { useChurchId } from '@/app/hooks/useChurchId';
import { usePermissions } from '@/app/hooks/usePermissions';
import { createSong } from '@/app/lib/songs';
import type { SongInput } from '@/app/lib/types';
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

export default function NewSongPage() {
  const router = useRouter();
  const { churchId } = useChurchId();
  const { canManageMusic, loading: permissionsLoading } = usePermissions();
  const canEdit = canManageMusic;
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');

  if (!churchId) {
    return (
      <>
        <PageHeader title="Add New Song" />
        <p className="text-muted-foreground">Loading…</p>
      </>
    );
  }

  if (permissionsLoading) {
    return (
      <>
        <PageHeader title="Add New Song" />
        <p className="text-muted-foreground">Loading…</p>
      </>
    );
  }

  if (!canEdit) {
    return (
      <>
        <PageHeader title="Add New Song" />
        <p className="text-muted-foreground">
          You do not have permission to add songs.
        </p>
      </>
    );
  }

  const handleCreate = async (data: SongInput) => {
    setSaving(true);

    try {
      await createSong(churchId, data);
      router.push(`/church/${churchId}/music/songs`);
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
      <PageHeader title="Add New Song" />
      <SongForm mode="new" onSave={handleCreate} saving={saving} onTitleChange={setTitle} />

      <Fab
        type="save"
        onClick={() => {
          // SongForm handles validation + calls handleCreate
          const submitButton = document.querySelector('[data-songform-submit]');
          (submitButton as HTMLButtonElement)?.click();
        }}
        disabled={saving || !title.trim()}
      />

    </>
  );
}
