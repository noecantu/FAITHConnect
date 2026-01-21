'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import { createSetList } from '@/lib/setlists';
import { SetListSection } from '@/lib/types';
import { useSongs } from '@/hooks/useSongs';
import { SetListSectionEditor } from '@/components/music/SetListSectionEditor';

export default function NewSetListPage() {
  const router = useRouter();
  const churchId = useChurchId();
  const { roles, isAdmin } = useUserRoles(churchId);
  const { songs: allSongs } = useSongs(churchId);

  const canEdit = isAdmin || roles.includes('WorshipLeader');

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [sections, setSections] = useState<SetListSection[]>([]);
  const [saving, setSaving] = useState(false);

  if (!churchId) {
    return (
      <div className="p-6">
        <PageHeader title="Create New Set List" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-6">
        <PageHeader title="Create New Set List" />
        <p className="text-muted-foreground">
          You do not have permission to create set lists.
        </p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!title.trim() || !date) return;

    setSaving(true);

    const newSetList = {
      title: title.trim(),
      date: new Date(date),
      sections,
      serviceNotes: { notes: notes.trim() },
      createdBy: 'system',
    };

    const created = await createSetList(churchId, newSetList);
    router.push(`/music/setlists/${created.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Create New Set List" />

      <Card className="p-6 space-y-4">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Set List Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter Title"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>

          <Input
            type="date"
            value={date || ""}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Sections */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Sections & Songs</label>
          <SetListSectionEditor
            sections={sections}
            onChange={setSections}
            allSongs={allSongs}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special instructions, transitions, or reminders."
          />
        </div>

        {/* Save */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center">
          <Button
            className="w-full sm:w-auto"
            variant="secondary"
            onClick={() => router.push('/music/setlists')}
          >
            Cancel
          </Button>

          <Button
            className="w-full sm:w-auto"
            onClick={handleSave}
            disabled={saving || !title.trim() || !date}
          >
            {saving ? 'Saving…' : 'Create Set List'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
