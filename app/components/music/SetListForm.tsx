'use client';

import { useEffect, useState } from 'react';
import Flatpickr from 'react-flatpickr';
import { format } from 'date-fns';

import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { SetList, SetListSection } from '@/app/lib/types';
import { SetListSectionEditor } from '@/app/components/music/SetListSectionEditor';
import confirmDatePlugin from "flatpickr/dist/plugins/confirmDate/confirmDate";
import "flatpickr/dist/plugins/confirmDate/confirmDate.css";

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

  // NEW: service metadata fields
  // const [serviceType, setServiceType] = useState<"Sunday" | "Midweek" | "Special" | "">(
  //   initial?.serviceType ?? ""
  // );
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
      {/* Title */}
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {/* Date & Time */}
      <Flatpickr
        defaultValue={
          dateString && timeString
            ? `${dateString} ${timeString}`
            : undefined
        }
        options={{
          enableTime: true,
          time_24hr: false,
          dateFormat: "Y-m-d H:i",
          altInput: false,
          closeOnSelect: false,
          plugins: [
            confirmDatePlugin({
              confirmIcon: "<i class='fa fa-check'></i>",
              confirmText: "OK",
              showAlways: true,
              theme: "light"
            })
          ]
        }}
        onClose={(_, __, instance) => {
          const d = instance.selectedDates[0];
          if (!d) return;

          setDateString(format(d, "yyyy-MM-dd"));
          setTimeString(format(d, "HH:mm"));
        }}
        className="flatpickr-input w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />

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
