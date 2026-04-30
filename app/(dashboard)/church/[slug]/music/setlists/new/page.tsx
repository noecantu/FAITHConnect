'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const { churchId } = useChurchId();
  const { songs: allSongs } = useSongs(churchId);
  const { canManageSetlists, loading: permissionsLoading } = usePermissions();
  const canCreate = canManageSetlists;

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [canSave, setCanSave] = useState(false);
  const [submitForm, setSubmitForm] = useState<() => void>(() => () => {});

  if (!churchId) {
    return (
      <>
        <PageHeader title="Create New Set List" />
        <p className="text-muted-foreground">Loading…</p>
      </>
    );
  }

  if (permissionsLoading) {
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
    serviceType: string | null;
    serviceNotes: {
      theme: string | null;
      scripture: string | null;
      scriptureText?: string | null;
      scriptureTranslation?: string | null;
      notes: string | null;
    };
  }) => {
    setSaving(true);

    const newSetList = {
      title: data.title,
      dateString: data.dateString,
      timeString: data.timeString,
      sections: data.sections,
      createdBy: undefined,
      serviceType: data.serviceType,
      serviceNotes: {
        theme: data.serviceNotes.theme,
        scripture: data.serviceNotes.scripture,
        scriptureText: data.serviceNotes.scriptureText,
        scriptureTranslation: data.serviceNotes.scriptureTranslation,
        notes: data.serviceNotes.notes,
      },
    };

    try {
      const created = await createSetList(churchId, newSetList);
      router.push(`/church/${slug}/music/setlists/${created.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save set list");
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Create New Set List" />

      <Card className="p-6 space-y-4 relative bg-black/80 border-white/20 backdrop-blur-xl">

        {saveError && (
          <p className="text-sm text-destructive">{saveError}</p>
        )}
        <SetListForm
          mode="create"
          initial={undefined}
          allSongs={allSongs}
          onSubmit={handleSubmit}
          onReady={(fn) => setSubmitForm(() => fn)}
          onValidityChange={setCanSave}
        />
      </Card>

      <Fab
        type="save"
        onClick={() => submitForm()}
        disabled={saving || !canSave}
      />
    </>
  );
}
