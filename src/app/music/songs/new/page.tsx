'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { SongForm } from '@/components/music/SongForm';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import { createSong } from '@/lib/songs';
import type { SongInput } from '@/lib/types';
import { Button } from '@/components/ui/button';

export default function NewSongPage() {
  const router = useRouter();
  const churchId = useChurchId();
  const { roles, isAdmin } = useUserRoles(churchId);

  const canEdit = isAdmin || roles.includes('WorshipLeader');
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
    </div>
  );  
  
}
