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
import { SetList, SetListSection } from '@/lib/types';
import { SetListSectionEditor } from '@/components/music/SetListSectionEditor';

export default function EditSetListPage() {
  const { id } = useParams();
  const router = useRouter();
  const churchId = useChurchId();
  const { songs: allSongs } = useSongs(churchId);
  const { isAdmin, isMusicManager } = useUserRoles(churchId);
  const canEdit = isAdmin || isMusicManager;
  
  const [setList, setSetList] = useState<SetList | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [sections, setSections] = useState<SetListSection[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!churchId || !id) return;

    const load = async () => {
      const data = await getSetListById(churchId, id as string);
      setSetList(data);
      setLoading(false);

      if (data) {
        setTitle(data.title);
        setDate(new Date(data.date).toISOString().split('T')[0]);
        setSections(data.sections ?? []);
        setNotes(data.serviceNotes?.notes ?? '');
      }
    };

    load();
  }, [churchId, id]);
  
  useEffect(() => {
    if (setList?.date) {
      const d = new Date(setList.date);
      const hhmm = d.toISOString().slice(11, 16); // "HH:MM"
      setTime(hhmm);
    }
  }, [setList]);
  
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

  const handleSave = async () => {
    if (!title.trim() || !date || !time) return;
  
    setSaving(true);
  
    // Combine date + time into a single Date object
    const [hours, minutes] = time.split(':').map(Number);
  
    const finalDate = new Date(date);
    finalDate.setHours(hours);
    finalDate.setMinutes(minutes);
    finalDate.setSeconds(0);
    finalDate.setMilliseconds(0);
  
    const updated: Partial<SetList> = {
      title: title.trim(),
      date: finalDate,
      sections,
      serviceNotes: {
        ...setList.serviceNotes,
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Event Time</label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full"
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
