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
import type { Event as EventType } from '../lib/types';
import type { UseFormReturn } from "react-hook-form";
import type { EventFormValues } from "@/app/components/calendar/EventFormDialog";

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

  if (typeof value === "object" && "toDate" in value) {
    return value.toDate();
  }

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
  isAdmin: boolean,
  managerGroup: string | null,
  form: UseFormReturn<EventFormValues>
) {
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EventType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayEventsDialogOpen, setIsDayEventsDialogOpen] = useState(false);

  const isEditing = editEvent !== null;

  // -------------------------------
  // EDIT EVENT
  // -------------------------------
  function handleEdit(event: EventType) {
    if (!isAdmin) {
      if (!managerGroup || !event.groups?.includes(managerGroup)) {
        toast({
          title: 'Permission Denied',
          description: 'You cannot edit events outside your group.',
        });
        return;
      }
    }

    setEditEvent(event);

    form.reset({
      title: event.title,
      description: event.description ?? "",
      date: normalizeDate(event.date), // <-- ALWAYS a Date
      isPublic: event.isPublic ?? false,
      groups: event.groups ?? [],
    });

    setIsDayEventsDialogOpen(false);
    setIsFormOpen(true);
  }

  // -------------------------------
  // ADD EVENT
  // -------------------------------
  function handleAdd(date: Date) {
    if (!isAdmin && !managerGroup) {
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
      isPublic: isAdmin ? false : false, // managers always private
      groups: isAdmin ? [] : managerGroup ? [managerGroup] : [],
    });

    setEditEvent(null);
    setIsDayEventsDialogOpen(false);
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

    try {
      const ref = doc(db, 'churches', churchId, 'events', id);
      const snap = await getDoc(ref);

      if (!snap.exists()) return;

      const event = snap.data() as EventType;

      if (!isAdmin) {
        if (!managerGroup || !event.groups?.includes(managerGroup)) {
          toast({
            title: 'Permission Denied',
            description: 'You cannot delete events outside your group.',
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

    let isPublic: boolean;
    let groups: string[];

    if (isAdmin) {
      isPublic = data.isPublic ?? true;
      groups = Array.isArray(data.groups) ? data.groups : [];
    } else if (managerGroup) {
      isPublic = false;
      groups = [managerGroup];
    } else {
      isPublic = true;
      groups = [];
    }

    try {
      if (isEditing && editEvent) {
        const ref = doc(db, 'churches', churchId, 'events', editEvent.id);

        if (!isAdmin) {
          if (!managerGroup || !editEvent.groups?.includes(managerGroup)) {
            toast({
              title: 'Permission Denied',
              description: 'You cannot edit events outside your group.',
            });
            return;
          }
        }

        await updateDoc(ref, {
          churchId,
          title: data.title,
          description: data.description ?? '',
          date: dateToStore,
          isPublic,
          groups,
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
          isPublic,
          groups,
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
      // console.error(error);
      console.error("🔥 FIRESTORE ERROR DETAILS:", JSON.stringify(error, null, 2));
      toast({
        title: 'Error saving event',
        description: 'Please try again.',
      });
    }
  }

  // -------------------------------
  // SELECT DATE
  // -------------------------------
  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setIsDayEventsDialogOpen(true);
  }

  return {
    isFormOpen,
    editEvent,
    deleteId,
    selectedDate,
    isDayEventsDialogOpen,
    isEditing,
    isAdmin,

    setIsFormOpen,
    setEditEvent,
    setDeleteId,
    setSelectedDate,
    setIsDayEventsDialogOpen,

    handleEdit,
    handleAdd,
    handleDelete,
    handleSelectDate,
    onSubmit,
  };
}
