'use client';

import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { Card } from '@/app/components/ui/card';
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

      <Card className="p-6 space-y-4">
        <SetListForm
          mode="create"
          initial={undefined}
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
      />
    </div>
  );
}
