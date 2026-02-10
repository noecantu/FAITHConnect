'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { db } from '../lib/firebase';
import {
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { useToast } from '../hooks/use-toast';
import type { Event as EventType } from '../lib/types';
import type { UseFormReturn } from "react-hook-form";

// -------------------------------
// UTILITIES
// -------------------------------

// Normalize Firestore Timestamp / string / Date
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

  // Firestore Timestamp
  if (typeof value === "object" && "toDate" in value) {
    return value.toDate();
  }

  // ISO string
  if (typeof value === "string") {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback
  return new Date();
}

// Store dates at noon to avoid UTC rollover
function safeDateOnly(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12, 0, 0 // noon = no timezone drift
  );
}

// -------------------------------
// FORM VALUES TYPE
// -------------------------------
export type EventFormValues = {
  title: string;
  description?: string;
  date: Date;
};

// -------------------------------
// MAIN HOOK
// -------------------------------
export function useCalendarDialogs(
  churchId: string | null,
  isEventManager: boolean,
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
    if (!isEventManager) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to edit events.',
        variant: 'destructive',
      });
      return;
    }

    const normalized = normalizeDate(event.date);

    setEditEvent(event);
    form.reset({
      title: event.title,
      description: event.description ?? '',
      date: normalized,
    });

    setIsDayEventsDialogOpen(false);
    setIsFormOpen(true);
  }

  // -------------------------------
  // ADD EVENT
  // -------------------------------
  function handleAdd(date: Date) {
    if (!isEventManager) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to add events.',
        variant: 'destructive',
      });
      return;
    }

    form.reset({
      title: '',
      description: '',
      date: normalizeDate(date),
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
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteDoc(doc(db, 'churches', churchId, 'events', id));
      toast({
        title: 'Event Deleted',
        description: 'The event has been removed.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error deleting event',
        description: 'Please try again.',
        variant: 'destructive',
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
        variant: 'destructive',
      });
      return;
    }

    if (!isEventManager) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to manage events.',
        variant: 'destructive',
      });
      return;
    }

    const dateToStore = safeDateOnly(data.date);

    try {
      if (isEditing && editEvent) {
        const ref = doc(db, 'churches', churchId, 'events', editEvent.id);

        await updateDoc(ref, {
          title: data.title,
          description: data.description ?? '',
          date: dateToStore,
          updatedAt: serverTimestamp(),
        });

        toast({
          title: 'Event Updated',
          description: `"${data.title}" has been updated.`,
        });
      } else {
        const colRef = collection(db, 'churches', churchId, 'events');

        await addDoc(colRef, {
          title: data.title,
          description: data.description ?? '',
          date: dateToStore,
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
      console.error(error);
      toast({
        title: 'Error saving event',
        description: 'Please try again.',
        variant: 'destructive',
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

  // -------------------------------
  // RETURN API
  // -------------------------------
  return {
    isFormOpen,
    editEvent,
    deleteId,
    selectedDate,
    isDayEventsDialogOpen,
    isEditing,

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
