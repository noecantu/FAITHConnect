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

export default function NewSetListPage() {
  const router = useRouter();
  const { churchId } = useChurchId();
  const { songs: allSongs } = useSongs(churchId);
  const { isAdmin, isMusicManager } = useUserRoles(churchId);
  const canCreate = isAdmin || isMusicManager;
  
  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:30');
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
  
  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);

    const baseDate = date ? new Date(date) : new Date();

    let hours = 10;
    let minutes = 30;

    if (time) {
      const parts = time.split(':').map(Number);
      if (parts.length === 2) {
        hours = parts[0];
        minutes = parts[1];
      }
    }

    baseDate.setHours(hours, minutes, 0, 0);

    const newSetList = {
      title: title.trim(),
      dateString: baseDate.toISOString().slice(0, 10),
      timeString: time,
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

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>

          <Input
            type="date"
            value={date || ""}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Event Time</label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full h-10"
            style={{ width: '100%' }}
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
        disabled={saving || !title.trim() || !date}
      />

    </div>
  );
}
