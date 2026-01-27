'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '../../../components/page-header';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';
import { useChurchId } from '../../../hooks/useChurchId';
import { useUserRoles } from '../../../hooks/useUserRoles';
import { createSetList } from '../../../lib/setlists';
import { SetListSection } from '../../../lib/types';
import { useSongs } from '../../../hooks/useSongs';
import { SetListSectionEditor } from '../../../components/music/SetListSectionEditor';
import { Fab } from '../../../components/ui/fab';

export default function NewSetListPage() {
  const router = useRouter();
  const churchId = useChurchId();
  const { songs: allSongs } = useSongs(churchId);
  const { isAdmin, isMusicManager } = useUserRoles(churchId);
  const canCreate = isAdmin || isMusicManager;
  
  // Form state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
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
    console.log("Saving…", { churchId, title, date, time, sections });
  
    if (!title.trim()) return;
  
    setSaving(true);
  
    // Default date = today if none selected
    const baseDate = date ? new Date(date) : new Date();
  
    // Default time = 10:30 AM if none selected
    let hours = 10;
    let minutes = 30;
  
    if (time) {
      const parts = time.split(':').map(Number);
      if (parts.length === 2) {
        hours = parts[0];
        minutes = parts[1];
      }
    }
  
    baseDate.setHours(hours);
    baseDate.setMinutes(minutes);
    baseDate.setSeconds(0);
    baseDate.setMilliseconds(0);
  
    const newSetList = {
      title: title.trim(),
      date: baseDate,
      sections,
      serviceNotes: { notes: notes.trim() },
      createdBy: 'system',
    };
  
    if (!churchId) return; // safety
  
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
      </Card>

      <Fab
        type="save"
        onClick={handleSave}
        disabled={saving || !title.trim() || !date}
      />

    </div>
  );
}
