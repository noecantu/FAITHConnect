// app/components/calendar/EventEditor.tsx
"use client";

import { useEffect, useState } from "react";

import dayjs from "dayjs";

import { useChurchId } from "@/app/hooks/useChurchId";
import { createEvent, updateEvent } from "@/app/lib/events";

import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { MultiSelect } from "@/app/components/ui/multi-select";

import { EVENT_GROUP_OPTIONS } from "@/app/lib/eventGroups";
import { extractUserGroups } from "@/app/lib/extractUserGroups";
import { isAdmin, Role } from "@/app/lib/roleGroups";
import type { UserProfile } from "@/app/lib/types";

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

  // --- USER STATE ---
  const [user, setUser] = useState<UserProfile | null>(null);

  // --- BASE DATE/TIME FROM INITIAL EVENT ---
  const initialDateObj = initialEvent?.date
    ? new Date(initialEvent.date)
    : new Date();

  const [localDateString, setLocalDateString] = useState(
    initialEvent?.dateString ?? dayjs(initialDateObj).format("YYYY-MM-DD")
  );

  const [localTimeString, setLocalTimeString] = useState(
    initialEvent?.timeString ?? dayjs(initialDateObj).format("HH:mm")
  );

  // --- FORM STATE ---
  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [description, setDescription] = useState(
    initialEvent?.description ?? ""
  );

  const [isPublic, setIsPublic] = useState(
    initialEvent?.isPublic ?? true
  );

  const [groups, setGroups] = useState<string[]>(
    initialEvent?.groups ?? []
  );

  const [saving, setSaving] = useState(false);

  // --- LOAD USER ---
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users/me");
      const raw = await res.json();

      const profile: UserProfile = {
        ...raw,
        roles: raw.roles as Role[],
      };

      setUser(profile);
    }

    load();
  }, []);

  // --- ROLE + GROUP LOGIC ---
  const roles = user?.roles ?? [];
  const admin = isAdmin(roles);

  const userGroups = user ? extractUserGroups(user) : [];
  const isManager = user && !admin && userGroups.length === 1;
  const managerGroup = isManager ? userGroups[0].toLowerCase() : null;

  // --- LOADING UI ---
  if (!user) {
    return <div className="p-4">Loading...</div>;
  }

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    if (!title || !localDateString || !localTimeString) return;

    setSaving(true);

    let finalIsPublic = isPublic;
    let finalGroups = groups;

    if (isManager) {
      finalIsPublic = false;
      finalGroups = [managerGroup!];
    }

    const combinedDate = new Date(
      `${localDateString}T${localTimeString}:00`
    );

    const payload = {
      title,
      description,
      dateString: localDateString,
      timeString: localTimeString,
      date: combinedDate,
      isPublic: finalIsPublic,
      groups: finalIsPublic ? [] : finalGroups,
    };

    if (mode === "create") {
      await createEvent(churchId!, payload);
    } else {
      await updateEvent(churchId!, initialEvent.id, payload);
    }

    setSaving(false);
    onSaved();
  };

  // --- HANDLERS FOR DATE/TIME INPUTS ---
  const handleDateChange = (value: string) => {
    setLocalDateString(value);
  };

  const handleTimeChange = (value: string) => {
    setLocalTimeString(value);
  };

  return (
    <>
      {/* Scrollable content */}
      <div className="flex-grow overflow-y-auto px-6 py-2 space-y-4">
        {/* Date & Time */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Date */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={localDateString}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Time */}
            <div className="flex flex-col space-y-1">
              <label className="text-sm font-medium">Time</label>
              <Input
                type="time"
                value={localTimeString}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full"
              />
            </div>

          </div>
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
          <label className="block text-sm font-medium mb-1">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="h-24"
          />
        </div>

        {/* Visibility */}
        {admin && (
          <div className="space-y-4 border-t border-white/20 pt-6 mt-6">
            <h3 className="text-lg font-semibold">Visibility</h3>

            <div className="space-y-2">
              <label className="text-white/60 text-sm">
                Who can see this event?
              </label>

              <div className="flex rounded-md overflow-hidden border border-white/20 bg-black/30">
                <button
                  type="button"
                  onClick={() => {
                    setIsPublic(true);
                    setGroups([]);
                  }}
                  className={
                    "flex-1 px-3 py-2 text-sm font-medium " +
                    (isPublic
                      ? "bg-slate-600 text-white"
                      : "text-white/60 hover:bg-white/10")
                  }
                >
                  Public
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={
                    "flex-1 px-3 py-2 text-sm font-medium " +
                    (!isPublic
                      ? "bg-slate-600 text-white"
                      : "text-white/60 hover:bg-white/10")
                  }
                >
                  Private
                </button>
              </div>
            </div>

            {!isPublic && (
              <div className="space-y-2">
                <label className="text-sm">Visible to Groups</label>
                <MultiSelect
                  options={EVENT_GROUP_OPTIONS}
                  value={groups}
                  onChange={setGroups}
                />
              </div>
            )}
          </div>
        )}

        {isManager && (
          <div className="space-y-2 border-t border-white/20 pt-4 mt-4">
            <label className="text-sm">Group</label>
            <div className="text-sm text-white/70">{managerGroup}</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t px-6 pb-6 pt-4 flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !title || !localDateString || !localTimeString}
        >
          {saving
            ? "Saving..."
            : mode === "create"
            ? "Add Event"
            : "Save Event"}
        </Button>
      </div>
    </>
  );
}
