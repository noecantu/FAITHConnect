'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { SongForm } from '@/app/components/music/SongForm';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { createSong } from '@/app/lib/songs';
import type { SongInput } from '@/app/lib/types';
import { Fab } from '@/app/components/ui/fab';

export default function NewSongPage() {
  const router = useRouter();
  const { churchId } = useChurchId();
  const { isAdmin, isMusicManager } = useUserRoles(churchId);

  const canEdit = isAdmin || isMusicManager;
  const [saving, setSaving] = useState(false);

  if (!churchId) {
    return (
      <div className="p-6">
        <PageHeader title="Add New Song" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-6">
        <PageHeader title="Add New Song" />
        <p className="text-muted-foreground">
          You do not have permission to add songs.
        </p>
      </div>
    );
  }

  const handleCreate = async (data: SongInput) => {
    setSaving(true);

    await createSong(churchId, {
      ...data,
      createdBy: 'system',
    });

    router.push('/music/songs');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Add New Song" />
      <SongForm mode="new" onSave={handleCreate} saving={saving} />

      <Fab
        type="save"
        onClick={() => {
          // SongForm handles validation + calls handleCreate
          const submitButton = document.querySelector('[data-songform-submit]');
          (submitButton as HTMLButtonElement)?.click();
        }}
        disabled={saving}
      />

    </div>
  );
}
