//app/components/calendar/EventEditor.tsx
"use client";

import { useEffect, useState } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";

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

  // --- FORM STATE (hooks must be unconditional) ---
  const [title, setTitle] = useState(initialEvent?.title ?? "");
  const [description, setDescription] = useState(initialEvent?.description ?? "");
  const [date, setDate] = useState(
    initialEvent?.date ? new Date(initialEvent.date) : new Date()
  );

  const [isPublic, setIsPublic] = useState(
    initialEvent?.isPublic ?? true
  );

  const [groups, setGroups] = useState<string[]>(
    initialEvent?.groups ?? []
  );

  const [saving, setSaving] = useState(false);

  // --- LOAD USER (same pattern as CalendarPage) ---
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

  // --- ROLE + GROUP LOGIC (must run AFTER hooks, BEFORE UI) ---
  const roles = user?.roles ?? [];
  const admin = isAdmin(roles);

  const userGroups = user ? extractUserGroups(user) : [];
  const isManager = user && !admin && userGroups.length === 1;
  const managerGroup = isManager ? userGroups[0].toLowerCase() : null;

  // --- LOADING UI (safe because all hooks already ran) ---
  if (!user) {
    return <div className="p-4">Loading...</div>;
  }

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    if (!title || !date) return;

    setSaving(true);

    let finalIsPublic = isPublic;
    let finalGroups = groups;

    if (isManager) {
      finalIsPublic = false;
      finalGroups = [managerGroup!];
    }

    const payload = {
      title,
      description,
      dateString: date.toISOString().split("T")[0],
      date,
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

  return (
    <>
      {/* Scrollable content */}
      <div className="flex-grow overflow-y-auto px-6 py-4 space-y-4">

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <Flatpickr
            value={date || ""}
            options={{
              dateFormat: "Y-m-d",
              altInput: true,
              altFormat: "F j, Y",
              static: true,
              closeOnSelect: true,
              appendTo: typeof window !== "undefined" ? document.body : undefined,
            }}
            onChange={(selected) => setDate(selected[0] ?? null)}
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

        {/* ⭐ VISIBILITY SECTION */}
        {admin && (
          <div className="space-y-4 border-t border-white/20 pt-6 mt-6">
            <h3 className="text-lg font-semibold">Visibility</h3>

            {/* Public / Private */}
            <div className="space-y-2">
              <label className="text-white/60 text-sm">Who can see this event?</label>

              <div className="flex rounded-md overflow-hidden border border-white/10 bg-black/30">
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

            {/* Group selection */}
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

        {/* ⭐ Manager view */}
        {isManager && (
          <div className="space-y-2 border-t border-white/10 pt-4 mt-4">
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
        <Button onClick={handleSave} disabled={saving || !title || !date}>
          {saving ? "Saving..." : mode === "create" ? "Add Event" : "Save Event"}
        </Button>
      </div>
    </>
  );
}
