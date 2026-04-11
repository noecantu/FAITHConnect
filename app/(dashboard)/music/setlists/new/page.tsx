'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { useChurchId } from '@/app/hooks/useChurchId';
import { usePermissions } from '@/app/hooks/usePermissions';
import { useSongs } from '@/app/hooks/useSongs';
import { createSetList } from '@/app/lib/setlists';
import { Fab } from '@/app/components/ui/fab';
import { SetListForm } from '@/app/components/music/SetListForm';
import { SetListSection } from '@/app/lib/types';
import { Card } from '@/app/components/ui/card';

export default function NewSetListPage() {
  const router = useRouter();
  const { churchId } = useChurchId();
  const { songs: allSongs } = useSongs(churchId);
  const { canManageMusic } = usePermissions();
  const canCreate = canManageMusic;

  const [saving, setSaving] = useState(false);
  const [submitForm, setSubmitForm] = useState<() => void>(() => () => {});

  if (!churchId) {
    return (
      <>
        <PageHeader title="Create New Set List" />
        <p className="text-muted-foreground">Loading…</p>
      </>
    );
  }

  if (!canCreate) {
    return (
      <>
        <PageHeader title="Create New Set List" />
        <p className="text-muted-foreground">
          You do not have permission to create set lists.
        </p>
      </>
    );
  }

  const handleSubmit = async (data: {
    title: string;
    dateString: string;
    timeString: string;
    sections: SetListSection[];
    serviceType: string | null;   // ✅ corrected type
    serviceNotes: {
      theme: string | null;
      scripture: string | null;
      notes: string | null;
    };
  }) => {
    setSaving(true);

    const newSetList = {
      title: data.title,
      dateString: data.dateString,
      timeString: data.timeString,
      sections: data.sections,
      createdBy: "system",
      serviceType: data.serviceType,   // string | null — matches form
      serviceNotes: {
        theme: data.serviceNotes.theme,
        scripture: data.serviceNotes.scripture,
        notes: data.serviceNotes.notes,
      },
    };

    const created = await createSetList(churchId, newSetList);
    router.push(`/music/setlists/${created.id}`);
  };

  return (
    <>
      <PageHeader title="Create New Set List" />

      <Card className="p-6 space-y-4">
        <SetListForm
          mode="create"
          initial={undefined}
          allSongs={allSongs}
          onSubmit={handleSubmit}
          onReady={(fn) => setSubmitForm(() => fn)}
        />
      </Card>

      <Fab
        type="save"
        onClick={() => submitForm()}
        disabled={saving}
      />
    </>
  );
}
