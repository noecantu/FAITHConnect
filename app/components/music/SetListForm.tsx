'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { SetList, SetListSection } from '@/app/lib/types';
import { SetListSectionEditor } from '@/app/components/music/SetListSectionEditor';
import { ScriptureLookupPanel } from '@/app/components/service-plans/ScriptureLookupPanel';

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
      scriptureText?: string | null;
      scriptureTranslation?: string | null;
      notes: string | null;
    };
  }) => void;
  onReady?: (submitFn: () => void) => void;
  onValidityChange?: (isValid: boolean) => void;
}

export function SetListForm({ initial, allSongs, onSubmit, onReady, onValidityChange }: SetListFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [dateString, setDateString] = useState(
    initial?.dateString ?? new Date().toISOString().substring(0, 10)
  );
  const [timeString, setTimeString] = useState(initial?.timeString ?? '09:00');
  const [sections, setSections] = useState<SetListSection[]>(initial?.sections ?? []);

  const [serviceType, setServiceType] = useState(initial?.serviceType ?? '');
  const [theme, setTheme] = useState(initial?.serviceNotes?.theme ?? '');
  const [scripture, setScripture] = useState(initial?.serviceNotes?.scripture ?? '');
  const [scriptureText, setScriptureText] = useState(initial?.serviceNotes?.scriptureText ?? '');
  const [scriptureTranslation, setScriptureTranslation] = useState(initial?.serviceNotes?.scriptureTranslation ?? 'kjv');
  const [notes, setNotes] = useState(initial?.serviceNotes?.notes ?? '');
  const onReadyRef = useRef(onReady);
  const onValidityChangeRef = useRef(onValidityChange);
  const onSubmitRef = useRef(onSubmit);
  const valuesRef = useRef({
    title: initial?.title ?? '',
    dateString: initial?.dateString ?? new Date().toISOString().substring(0, 10),
    timeString: initial?.timeString ?? '09:00',
    sections: initial?.sections ?? [],
    serviceType: initial?.serviceType ?? '',
    theme: initial?.serviceNotes?.theme ?? '',
    scripture: initial?.serviceNotes?.scripture ?? '',
    scriptureText: initial?.serviceNotes?.scriptureText ?? '',
    scriptureTranslation: initial?.serviceNotes?.scriptureTranslation ?? 'kjv',
    notes: initial?.serviceNotes?.notes ?? '',
  });

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onValidityChangeRef.current = onValidityChange;
  }, [onValidityChange]);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  const isFormValid =
    title.trim().length > 0 &&
    dateString.trim().length > 0 &&
    timeString.trim().length > 0 &&
    sections.every((section) => section.title.trim().length > 0);

  useEffect(() => {
    valuesRef.current = {
      title,
      dateString,
      timeString,
      sections,
      serviceType,
      theme,
      scripture,
      scriptureText,
      scriptureTranslation,
      notes,
    };
  }, [title, dateString, timeString, sections, serviceType, theme, scripture, scriptureText, scriptureTranslation, notes]);

  const handleSubmit = useCallback(() => {
    const current = valuesRef.current;
    const submitIsValid =
      current.title.trim().length > 0 &&
      current.dateString.trim().length > 0 &&
      current.timeString.trim().length > 0 &&
      current.sections.every((section) => section.title.trim().length > 0);

    if (!submitIsValid) return;

    onSubmitRef.current({
      title: current.title.trim(),
      dateString: current.dateString,
      timeString: current.timeString,
      sections: current.sections,
      serviceType: current.serviceType,
      serviceNotes: {
        theme: current.theme.trim() || null,
        scripture: current.scripture.trim() || null,
        scriptureText: current.scriptureText.trim() || null,
        scriptureTranslation: current.scriptureTranslation.trim() || null,
        notes: current.notes.trim() || null,
      },
    });
  }, []);

  useEffect(() => {
    onReadyRef.current?.(handleSubmit);
  }, [handleSubmit]);

  useEffect(() => {
    onValidityChangeRef.current?.(isFormValid);
  }, [isFormValid]);

  return (
    <div className="space-y-6">

      {/* Date & Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={dateString}
            onChange={(e) => setDateString(e.target.value)}
          />
        </div>

        <div className="flex flex-col space-y-2">
          <Label>Time</Label>
          <Input
            type="time"
            value={timeString}
            onChange={(e) => setTimeString(e.target.value)}
          />
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Service Details */}
      <div className="space-y-4 rounded-md border border-border p-4 bg-muted/30">
        <h2 className="text-lg font-semibold text-foreground">Service Details</h2>

        <div className="space-y-2">
          <Label>Service Type</Label>
          <Input
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            placeholder="Optional: Sunday Service, Mid-Week, Special, etc."
          />
        </div>

        <div className="space-y-2">
          <Label>Theme</Label>
          <Input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Optional theme for this service"
          />
        </div>

        <div className="space-y-2">
          <Label>Scripture</Label>
          <ScriptureLookupPanel
            scripture={scripture}
            scriptureTranslation={scriptureTranslation}
            scriptureText={scriptureText}
            onScriptureChange={setScripture}
            onScriptureTranslationChange={setScriptureTranslation}
            onScriptureTextChange={setScriptureText}
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
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special instructions, transitions, or reminders."
        />
      </div>

      <button type="submit" onClick={handleSubmit} className="hidden" />
    </div>
  );
}