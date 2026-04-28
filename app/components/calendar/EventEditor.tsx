// app/components/calendar/EventEditor.tsx
"use client";

import { useEffect, useState } from "react";

import dayjs from "dayjs";

import { useChurchId } from "@/app/hooks/useChurchId";
import { useMembers } from "@/app/hooks/useMembers";
import { useToast } from "@/app/hooks/use-toast";
import { createEvent, updateEvent } from "@/app/lib/events";

import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { MultiSelect } from "@/app/components/ui/multi-select";

import type { Role } from "@/app/lib/auth/roles";
import { EVENT_GROUP_OPTIONS } from "@/app/lib/groupOptions";
import type { Member, UserProfile } from "@/app/lib/types";
import { can } from "@/app/lib/auth/permissions";

interface EventEditorProps {
  mode: "create" | "edit";
  initialEvent: {
    id: string;
    date?: Date;
    dateString?: string;
    timeString?: string;
    title?: string;
    description?: string;
    isPublic?: boolean;
    visibility?: "public" | "private";
    groups?: string[];
    memberIds?: string[];
  } | null;
  onCancel: () => void;
  onSaved: () => void;
}

function getMemberOptionLabel(member: Member): string {
  const fullName = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim();
  if (fullName && member.email) return `${fullName} (${member.email})`;
  if (fullName) return fullName;
  return member.email ?? "Unnamed member";
}

export default function EventEditor({
  mode,
  initialEvent,
  onCancel,
  onSaved,
}: EventEditorProps) {
  const { churchId } = useChurchId();
  const { members } = useMembers();
  const { toast } = useToast();

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
    typeof initialEvent?.isPublic === "boolean"
      ? initialEvent.isPublic
      : initialEvent?.visibility === "private"
      ? false
      : true
  );

  const [groups, setGroups] = useState<string[]>(
    initialEvent?.groups ?? []
  );

  const [memberIds, setMemberIds] = useState<string[]>(
    initialEvent?.memberIds ?? []
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  function extractUserGroups(user: UserProfile): string[] {
    return user.roles
      .filter((r) => r.endsWith("Group") || r.endsWith("GroupManager"))
      .map((r) =>
        r.replace("Manager", "").replace("Group", "").toLowerCase()
      );
  }

  // --- ROLE + GROUP LOGIC ---
  const roles = user?.roles ?? [];
  const canManageVisibility = can(roles, "events.manage");
  const memberOptions = members
    .filter((member) => member.status !== "Archived")
    .map((member) => ({
      label: getMemberOptionLabel(member),
      value: member.id,
    }));

  // --- LOADING UI ---
  if (!user) {
    return <div className="p-4">Loading...</div>;
  }

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    if (!title || !localDateString || !localTimeString) return;

    setSaving(true);
    setSaveError(null);

    if (!isPublic && groups.length === 0 && memberIds.length === 0) {
      const message = "Private events must be visible to at least one group or member.";
      setSaveError(message);
      toast({
        title: "Missing audience",
        description: message,
      });
      setSaving(false);
      return;
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
      visibility: isPublic ? "public" : "private",
      groups: isPublic ? [] : groups,
      memberIds: isPublic ? [] : memberIds,
    };

    try {
      if (mode === "create") {
        await createEvent(churchId!, payload);
      } else {
        if (!initialEvent?.id) throw new Error("Missing event id");
        await updateEvent(churchId!, initialEvent.id, payload);
      }

      onSaved();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save event";
      setSaveError(message);
      toast({
        title: "Error saving event",
        description: message,
      });
    } finally {
      setSaving(false);
    }
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
        {saveError && (
          <p className="text-sm text-destructive">{saveError}</p>
        )}

        {/* Date & Time */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Date */}
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={localDateString}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Time */}
            <div className="flex flex-col space-y-2">
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
        {canManageVisibility && (
          <div className="space-y-4 border-t border-white/20 pt-6 mt-6">
            <h3 className="text-lg font-semibold">Visibility</h3>

            <div className="space-y-2">
              <label className="text-white/60 text-sm">
                Who can see this event?
              </label>

              <div className="flex rounded-md overflow-hidden border border-white/20 bg-black/80">
                <button
                  type="button"
                  onClick={() => {
                    setIsPublic(true);
                    setGroups([]);
                    setMemberIds([]);
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm">Visible to Groups</label>
                  <MultiSelect
                    options={EVENT_GROUP_OPTIONS}
                    value={groups}
                    onChange={setGroups}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm">Visible to Members</label>
                  <MultiSelect
                    options={memberOptions}
                    value={memberIds}
                    onChange={setMemberIds}
                  />
                </div>

                <p className="text-xs text-white/60 md:col-span-2">
                  Choose one or both. Leave both empty only for public events.
                </p>
              </div>
            )}
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
