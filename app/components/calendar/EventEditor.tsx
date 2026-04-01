"use client";

import { useState } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";

import { useChurchId } from "@/app/hooks/useChurchId";
import { createEvent, updateEvent } from "@/app/lib/events";

import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";

interface EventEditorProps {
  mode: "create" | "edit";
  initialEvent: any | null;
  onCancel: () => void;
  onSaved: () => void;
}

export default function EventEditor({
  mode,
  initialEvent,
  onCancel,
  onSaved,
}: EventEditorProps) {
  const { churchId } = useChurchId();

  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [description, setDescription] = useState(initialEvent?.description ?? "");
  const [date, setDate] = useState(
    initialEvent?.date ? new Date(initialEvent.date) : null
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title || !date) return;

    setSaving(true);

    const payload = {
      title,
      description,
      dateString: date.toISOString().split("T")[0],
      date,
    };

    if (mode === "create") {
      await createEvent(churchId!, payload);
    } else {
      await updateEvent(churchId!, initialEvent.id, payload);
    }

    setSaving(false);
    onSaved();
  };

  return (
    <>
      {/* Scrollable content */}
      <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <Flatpickr
            value={date ?? undefined}
            options={{
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "F j, Y",
              static: true,
              closeOnSelect: true,
            }}
            onChange={(selected) => setDate(selected[0])}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="h-24"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t px-6 pb-6 pt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving || !title || !date}>
          {saving ? "Saving..." : mode === "create" ? "Add Event" : "Save Event"}
        </Button>
      </div>
    </>
  );
}
