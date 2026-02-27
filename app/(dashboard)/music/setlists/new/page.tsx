'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { Card } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { createSetList } from '@/app/lib/setlists';
import { SetListSection } from '@/app/lib/types';
import { useSongs } from '@/app/hooks/useSongs';
import { SetListSectionEditor } from '@/app/components/music/SetListSectionEditor';
import { Fab } from '@/app/components/ui/fab';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

import Flatpickr from "react-flatpickr";
import dayjs from "dayjs";

export default function NewSetListPage() {
  const router = useRouter();
  const { churchId } = useChurchId();
  const { songs: allSongs } = useSongs(churchId);
  const { isAdmin, isMusicManager } = useUserRoles(churchId);
  const canCreate = isAdmin || isMusicManager;

  // Form state
  const [title, setTitle] = useState('');
  const [dateString, setDateString] = useState(dayjs().format("YYYY-MM-DD"));
  const [timeString, setTimeString] = useState("10:30"); // default time
  const [notes, setNotes] = useState('');
  const [sections, setSections] = useState<SetListSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [serviceType, setServiceType] = useState<"Sunday" | "Midweek" | "Special" | null>(null);

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

  // Reconstruct full JS Date for Flatpickr
  const fullDate = dayjs(`${dateString}T${timeString}`).toDate();

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const newSetList = {
      title: title.trim(),
      dateString,
      timeString,
      sections,
      createdBy: "system",
      serviceType: serviceType ?? null,
      serviceNotes: { notes: notes.trim() },
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

        {/* Service Type */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-foreground">
            Service Type
          </label>

          <Select
            value={serviceType ?? ""}
            onValueChange={(value) =>
              setServiceType(
                value === "" ? null : (value as "Sunday" | "Midweek" | "Special")
              )
            }
          >
            <SelectTrigger className="w-full bg-muted text-foreground border border-border">
              <SelectValue placeholder="Select service type" />
            </SelectTrigger>

            <SelectContent className="bg-popover text-foreground border border-border">
              <SelectItem value="Sunday">Sunday</SelectItem>
              <SelectItem value="Midweek">Midweek</SelectItem>
              <SelectItem value="Special">Special</SelectItem>
            </SelectContent>
          </Select>
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
