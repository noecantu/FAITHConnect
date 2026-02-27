'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { useSongs } from '@/app/hooks/useSongs';
import { getSetlistById, updateSetlist } from "@/app/(dashboard)/music/setlists/actions";
import { SetList, SetListSection } from '@/app/lib/types';
import { SetListSectionEditor } from '@/app/components/music/SetListSectionEditor';
import { Fab } from '@/app/components/ui/fab';

import Flatpickr from "react-flatpickr";
import dayjs from "dayjs";

export default function EditSetListPage() {
  const { id } = useParams();
  const router = useRouter();
  const { churchId } = useChurchId();
  const { songs: allSongs } = useSongs(churchId);
  const { isAdmin, isMusicManager } = useUserRoles();
  const canEdit = isAdmin || isMusicManager;

  const [setList, setSetList] = useState<SetList | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [dateString, setDateString] = useState('');
  const [timeString, setTimeString] = useState('');
  const [notes, setNotes] = useState('');
  const [sections, setSections] = useState<SetListSection[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!churchId || !id) return;

    const load = async () => {
      const data = await getSetlistById(churchId, id as string);
      setSetList(data);
      setLoading(false);

      if (data) {
        setTitle(data.title);
        setDateString(data.dateString);
        setTimeString(data.timeString ?? "10:00");
        setSections(data.sections ?? []);
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

  // Reconstruct full JS Date for Flatpickr
  const fullDate = dayjs(`${dateString}T${timeString}`).toDate();

  const handleSave = async () => {
    if (!title.trim() || !dateString || !timeString) return;

    setSaving(true);

    const updated = {
      title: title.trim(),
      dateString,
      timeString,
      sections,
      serviceNotes: {
        ...setList.serviceNotes,
        notes: notes.trim(),
      },
      updatedAt: Date.now(),
    };

    await updateSetlist(churchId, setList.id, updated);
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

        {/* Date & Time */}
        <div>
          <label className="block text-sm font-medium mb-1">Date & Time</label>

          <Flatpickr
            value={fullDate ?? []}
            options={{
              enableTime: true,
              time_24hr: false,
              dateFormat: "Y-m-d H:i",
              altInput: true,
              altFormat: "F j, Y h:i K",
              allowInput: false,
              static: true,
            }}
            onChange={(selectedDates) => {
              const d = selectedDates?.[0];
              if (!d) return;

              setDateString(dayjs(d).format("YYYY-MM-DD"));
              setTimeString(dayjs(d).format("HH:mm"));
            }}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

      </Card>

      <Fab
        type="save"
        onClick={handleSave}
        disabled={saving || !title.trim() || !dateString}
      />
    </div>
  );
}
