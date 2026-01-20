'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSongs } from '@/hooks/useSongs';
import { getSetListById, updateSetList } from '@/lib/setlists';
import { SetList, SetListSongEntry } from '@/lib/types';
import { SetListSongEditor } from '@/components/music/SetListSongEditor';

export default function EditSetListPage() {
  const { id } = useParams();
  const router = useRouter();
  const churchId = useChurchId();
  const { roles, isAdmin } = useUserRoles(churchId);
  const { songs: allSongs } = useSongs(churchId);

  const canEdit = isAdmin || roles.includes('WorshipLeader');

  const [setList, setSetList] = useState<SetList | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [songs, setSongs] = useState<SetListSongEntry[]>([]);
  const [saving, setSaving] = useState(false);

  // Load set list
  useEffect(() => {
    if (!churchId || !id) return;

    const load = async () => {
      const data = await getSetListById(churchId, id as string);
      setSetList(data);
      setLoading(false);

      if (data) {
        setTitle(data.title);
        setDate(new Date(data.date).toISOString().split('T')[0]);
        setSongs(data.songs);
        setNotes(data.serviceNotes?.notes ?? '');
      }
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

  // Save handler
  const handleSave = async () => {
    if (!title.trim() || !date) return;

    setSaving(true);

    const updated: Partial<SetList> = {
      title: title.trim(),
      date: new Date(date),
      songs,
      serviceNotes: {
        notes: notes.trim(),
      },
      updatedAt: new Date(),
    };

    await updateSetList(churchId, setList.id, updated);
    router.push(`/music/setlists/${setList.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Set List" />

      <Card className="p-6 space-y-4">

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Set List Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sunday Worship – March 3"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Songs */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Songs</label>
          <SetListSongEditor
            songs={songs}
            onChange={setSongs}
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
        <div
          className="
            flex flex-col gap-2
            sm:flex-row sm:justify-end sm:items-center
          "
        >
          <Button
            className="w-full sm:w-auto"
            variant="secondary"
            onClick={() => router.push(`/music/setlists/${setList.id}`)}
          >
            Cancel
          </Button>

          <Button
            className="w-full sm:w-auto"
            onClick={handleSave}
            disabled={saving || !title.trim() || !date}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
