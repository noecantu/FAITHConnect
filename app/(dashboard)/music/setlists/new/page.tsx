'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { useSongs } from '@/app/hooks/useSongs';
import { createSetList } from '@/app/lib/setlists';
import { Fab } from '@/app/components/ui/fab';
import { SetListForm } from '@/app/components/music/SetListForm';

export default function NewSetListPage() {
  const router = useRouter();
  const { churchId } = useChurchId();
  const { songs: allSongs } = useSongs(churchId);
  const { isAdmin, isMusicManager } = useUserRoles(churchId);
  const canCreate = isAdmin || isMusicManager;

  const [saving, setSaving] = useState(false);
  const [submitForm, setSubmitForm] = useState<() => void>(() => () => {});

  if (!churchId) {
    return (
      <div className="p-6">
        <PageHeader title="Create New Set List" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="p-6">
        <PageHeader title="Create New Set List" />
        <p className="text-muted-foreground">
          You do not have permission to create set lists.
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

    const newSetList = {
      title: data.title,
      dateString: data.dateString,
      timeString: data.timeString,
      sections: data.sections,
      createdBy: "system",
      serviceType: null,
      serviceNotes: { notes: data.notes },
    };

    const created = await createSetList(churchId, newSetList);
    router.push(`/music/setlists/${created.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Create New Set List" />

        <div className="p-6 space-y-6">
          <SetListForm
            mode="create"
            initial={undefined}
            allSongs={allSongs}
            onSubmit={handleSubmit}
            onReady={(fn) => setSubmitForm(() => fn)}
          />
        </div>

      <Fab
        type="save"
        onClick={() => submitForm()}
        disabled={saving}
      />
    </div>
  );
}
