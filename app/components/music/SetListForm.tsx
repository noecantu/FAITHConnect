'use client';

import { useEffect, useState } from 'react';
import Flatpickr from 'react-flatpickr';
import { format } from 'date-fns';

import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { SetList, SetListSection } from '@/app/lib/types';
import { SetListSectionEditor } from '@/app/components/music/SetListSectionEditor';
import { CenteredDateTimeFields } from "@/app/components/music/CenteredDateTimeFields";

interface SetListFormProps {
  mode: 'create' | 'edit';
  initial?: SetList;
  allSongs?: any[];
  onSubmit: (data: {
    title: string;
    dateString: string;
    timeString: string;
    sections: SetListSection[];
    notes: string;
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
  const [notes, setNotes] = useState(initial?.serviceNotes?.notes ?? '');

  const handleSubmit = () => {
    onSubmit({
      title: title.trim(),
      dateString,
      timeString,
      sections,
      notes: notes.trim(),
    });
  };

    useEffect(() => {
      onReady?.(handleSubmit);
    }, [title, dateString, timeString, sections, notes]);
    
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {/* Date & Time */}
      <div className="w-full space-y-1">
        <Label>Date & Time</Label>
        <div className="w-full">
          <CenteredDateTimeFields
            dateString={dateString}
            timeString={timeString}
            onDateChange={setDateString}
            onTimeChange={setTimeString}
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

      {/* Submit */}
      <button
        type="submit"
        onClick={handleSubmit}
        className="hidden"
      />
    </div>
  );
}
