'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { db } from '@/app/lib/firebase/client';
import {
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  collection,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';

import { useToast } from '../hooks/use-toast';
import type { Event as EventType, UserProfile } from '../lib/types';
import type { UseFormReturn } from "react-hook-form";
import type { EventFormValues } from "@/app/components/calendar/EventFormDialog";

import { canUser } from "@/app/lib/canUser";
import { extractUserGroups } from "@/app/lib/extractUserGroups";
import { MinistryGroup, normalizeGroupName } from '../lib/ministryGroups';

// -------------------------------
// UTILITIES
// -------------------------------
type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
};

type NormalizableDate =
  | Date
  | string
  | FirestoreTimestamp
  | null
  | undefined;

function normalizeDate(value: NormalizableDate): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  if (typeof value === "object" && "toDate" in value) return value.toDate();
  if (typeof value === "string") {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

// Store dates at noon to avoid UTC rollover
function safeDateOnly(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, 0, 0
  );
}

// -------------------------------
// MAIN HOOK
// -------------------------------
export function useCalendarDialogs(
  churchId: string | null,
  user: UserProfile | null,
  form: UseFormReturn<EventFormValues>
) {
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EventType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const isEditing = editEvent !== null;

  const canCreate = user ? canUser(user.roles, "createEvents") : false;
  const canEdit = user ? canUser(user.roles, "editEvents") : false;
  const canDelete = user ? canUser(user.roles, "deleteEvents") : false;

  const userGroups = user ? extractUserGroups(user) : [];
  const primaryGroup = userGroups[0] ?? null;

  const isEventManager = user?.roles.includes("EventManager") ?? false;

  const isMinistryManager =
  userGroups.length > 0 &&
  canEdit &&
  !user?.roles.includes("Admin") &&
  !user?.roles.includes("EventManager");

  // -------------------------------
  // EDIT EVENT
  // -------------------------------
  function handleEdit(event: EventType) {
    if (!canEdit && !isMinistryManager) {
      toast({
        title: 'Permission Denied',
        description: 'You cannot edit events.',
      });
      return;
    }

    // Private event: user must belong to at least one group
    if (event.visibility === "private" && !isEventManager) {
      const allowed = event.groups
        ?.map(g => normalizeGroupName(g))
        .filter(Boolean)
        .some(g => userGroups.includes(g as MinistryGroup));

      if (!allowed) {
        toast({
          title: 'Permission Denied',
          description: 'You cannot edit private events outside your groups.',
        });
        return;
      }
    }

    setEditEvent(event);

    form.reset({
      title: event.title,
      description: event.description,
      date: normalizeDate(event.date),
      isPublic: event.visibility === "public",
      groups: event.groups ?? [],
    });

    setIsFormOpen(true);
  }

  // -------------------------------
  // ADD EVENT
  // -------------------------------
  function handleAdd(date: Date) {
    // FIX: Allow ministry managers to add events
    if (!canCreate && !isMinistryManager) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to add events.',
      });
      return;
    }

    form.reset({
      title: "",
      description: "",
      date: normalizeDate(date),
      isPublic: user?.roles.includes("Admin") ?? false,
      groups: primaryGroup ? [primaryGroup] : [],
    });

    setEditEvent(null);
    setIsFormOpen(true);
  }

  // -------------------------------
  // DELETE EVENT
  // -------------------------------
  async function handleDelete(id: string) {
    if (!churchId) {
      toast({
        title: 'No church selected',
        description: 'Please select a church before deleting events.',
      });
      return;
    }

    if (!canDelete && !isMinistryManager) {
      toast({
        title: 'Permission Denied',
        description: 'You cannot delete events.',
      });
      return;
    }

    try {
      const ref = doc(db, 'churches', churchId, 'events', id);
      const snap = await getDoc(ref);

      if (!snap.exists()) return;

      const event = snap.data() as EventType;

      if (event.visibility === "private" && !isEventManager) {
        const allowed = event.groups
          ?.map(g => normalizeGroupName(g))
          .filter(Boolean)
          .some(g => userGroups.includes(g as MinistryGroup));

        if (!allowed) {
          toast({
            title: 'Permission Denied',
            description: 'You cannot delete private events outside your groups.',
          });
          return;
        }
      }

      await deleteDoc(ref);

      toast({
        title: 'Event Deleted',
        description: 'The event has been removed.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error deleting event',
        description: 'Please try again.',
      });
    }
  }

  // -------------------------------
  // SUBMIT (ADD OR EDIT)
  // -------------------------------
  async function onSubmit(data: EventFormValues) {
    if (!churchId) {
      toast({
        title: 'No church selected',
        description: 'Please select a church before saving events.',
      });
      return;
    }

    const normalized = normalizeDate(data.date);
    const dateToStore = safeDateOnly(normalized);

    const isPublic = data.isPublic ?? true;

    // ✅ Normalize groups to lowercase
    const groups = Array.isArray(data.groups)
      ? data.groups.map(g => g.toLowerCase())
      : [];

    try {
      if (isEditing && editEvent) {
        const ref = doc(db, 'churches', churchId, 'events', editEvent.id);

        await updateDoc(ref, {
          churchId,
          title: data.title,
          description: data.description ?? '',
          date: dateToStore,
          visibility: isPublic ? "public" : "private",
          groups, // ✅ now normalized
          updatedAt: serverTimestamp(),
        });

        toast({
          title: 'Event Updated',
          description: `"${data.title}" has been updated.`,
        });
      } else {
        const colRef = collection(db, 'churches', churchId, 'events');

        await addDoc(colRef, {
          churchId,
          title: data.title,
          description: data.description ?? '',
          date: dateToStore,
          visibility: user?.roles.includes("Admin")
            ? (data.isPublic ? "public" : "private")
            : "private",

          // ✅ Normalize groups for new events too
          groups: user?.roles.includes("Admin")
            ? groups
            : primaryGroup
              ? [primaryGroup.toLowerCase()]
              : [],

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        toast({
          title: 'Event Added',
          description: `"${data.title}" has been added to ${format(dateToStore, 'PPP')}.`,
        });
      }

      setIsFormOpen(false);
      setEditEvent(null);
    } catch (error) {
      console.error("🔥 FIRESTORE ERROR DETAILS:", JSON.stringify(error, null, 2));
      toast({
        title: 'Error saving event',
        description: 'Please try again.',
      });
    }
  }

  return {
    isFormOpen,
    editEvent,
    deleteId,
    isEditing,

    setIsFormOpen,
    setEditEvent,
    setDeleteId,

    handleEdit,
    handleAdd,
    handleDelete,
    onSubmit,
  };
}
