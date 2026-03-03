'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { Card } from '@/app/components/ui/card';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { useSongs } from '@/app/hooks/useSongs';
import { getSetListById, updateSetList } from '@/app/lib/setlists';
import { SetList } from '@/app/lib/types';
import { Fab } from '@/app/components/ui/fab';
import { SetListForm } from '@/app/components/music/SetListForm';

export default function EditSetListPage() {
  const { id } = useParams();
  const router = useRouter();
  const { churchId } = useChurchId();
  const { songs: allSongs } = useSongs(churchId);
  const { isAdmin, isMusicManager } = useUserRoles(churchId);
  const canEdit = isAdmin || isMusicManager;

  const [setList, setSetList] = useState<SetList | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!churchId || !id) return;

    const load = async () => {
      const data = await getSetListById(churchId, id as string);
      setSetList(data);
      setLoading(false);
    };

    load();
  }, [churchId, id]);

  if (!churchId) {
    return (
      <div className="p-6">
        <PageHeader title="Edit Set List" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Edit Set List" />
        <p className="text-muted-foreground">Loading set list…</p>
      </div>
    );
  }

  if (!setList) {
    return (
      <div className="p-6">
        <PageHeader title="Edit Set List" />
        <p className="text-muted-foreground">Set List not found.</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-6">
        <PageHeader title="Edit Set List" />
        <p className="text-muted-foreground">
          You do not have permission to edit set lists.
        </p>
      </div>
    );
  }

  const handleSubmit = async (data: {
    title: string;
    dateString: string;
    timeString: string;
    sections: any[];
    notes: string;
  }) => {
    setSaving(true);

    await updateSetList(churchId, setList.id, {
      ...data,
      serviceNotes: {
        ...setList.serviceNotes,
        notes: data.notes,
      },
    });

    router.push(`/music/setlists/${setList.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Set List" />

      <Card className="p-6 space-y-4">
        <SetListForm
          mode="edit"
          initial={setList}
          allSongs={allSongs}
          onSubmit={handleSubmit}
        />
      </Card>

      <Fab
        type="save"
        onClick={() => {
          const hiddenButton = document.querySelector(
            'button[type="submit"]'
          ) as HTMLButtonElement | null;

          hiddenButton?.click();
        }}
        disabled={saving}
      />
    </div>
  );
}
