'use client';

import { useEffect, useState } from 'react';

import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { SetList, SetListSection } from '@/app/lib/types';
import { SetListSectionEditor } from '@/app/components/music/SetListSectionEditor';

interface SetListFormProps {
  mode: 'create' | 'edit';
  initial?: SetList;
  allSongs?: any[];
  onSubmit: (data: {
    title: string;
    dateString: string;
    timeString: string;
    sections: SetListSection[];
    serviceType: string | null;
    serviceNotes: {
      theme: string | null;
      scripture: string | null;
      notes: string | null;
    };
  }) => void;
  onReady?: (submitFn: () => void) => void;
}

export function SetListForm({ initial, allSongs, onSubmit, onReady }: SetListFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [dateString, setDateString] = useState(
    initial?.dateString ?? new Date().toISOString().substring(0, 10)
  );
  const [timeString, setTimeString] = useState(initial?.timeString ?? '09:00');
  const [sections, setSections] = useState<SetListSection[]>(initial?.sections ?? []);

  const [serviceType, setServiceType] = useState(initial?.serviceType ?? '');
  const [theme, setTheme] = useState(initial?.serviceNotes?.theme ?? '');
  const [scripture, setScripture] = useState(initial?.serviceNotes?.scripture ?? '');
  const [notes, setNotes] = useState(initial?.serviceNotes?.notes ?? '');

  const handleSubmit = () => {
    onSubmit({
      title: title.trim(),
      dateString,
      timeString,
      sections,
      serviceType,
      serviceNotes: {
        theme: theme.trim() || null,
        scripture: scripture.trim() || null,
        notes: notes.trim() || null,
      },
    });
  };

  useEffect(() => {
    onReady?.(handleSubmit);
  }, [title, dateString, timeString, sections, serviceType, theme, scripture, notes]);

  return (
    <div className="space-y-4">
      {/* Date & Time */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Date */}
          <div className="flex flex-col space-y-1">
            <Label>Date</Label>
            <Input
              type="date"
              value={dateString}
              onChange={(e) => {
                const value = e.target.value
                setDateString(value)
              }}
              className="w-full"
            />
          </div>

          {/* Time */}
          <div className="flex flex-col space-y-1">
            <Label>Time</Label>
            <Input
              type="time"
              value={timeString}
              onChange={(e) => {
                const value = e.target.value
                setTimeString(value)
              }}
              className="w-full"
            />
          </div>

        </div>
      </div>

      {/* Title */}
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      
      {/* NEW: Service Details */}
      <div className="space-y-4 rounded-md border p-4 bg-white/5">
        <h2 className="text-lg font-semibold">Service Details</h2>

        {/* Service Type */}
        <div>
          <Label>Service Type</Label>
          <Input
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            placeholder="Optional: Sunday Service, Mid-Week, Special, etc."
          />
        </div>

        {/* Theme */}
        <div>
          <Label>Theme</Label>
          <Input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Optional theme for this service"
          />
        </div>

        {/* Scripture */}
        <div>
          <Label>Scripture</Label>
          <Input
            value={scripture}
            onChange={(e) => setScripture(e.target.value)}
            placeholder="Optional scripture reference"
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        <Label>Sections & Songs</Label>
        <SetListSectionEditor
          sections={sections}
          onChange={setSections}
          allSongs={allSongs ?? []}
        />
      </div>

      {/* Notes */}
      <div>
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions, transitions, or reminders."
        />
      </div>

      {/* Hidden submit button for parent form */}
      <button type="submit" onClick={handleSubmit} className="hidden" />
    </div>
  );
}
