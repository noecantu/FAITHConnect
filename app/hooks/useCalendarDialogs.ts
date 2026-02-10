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

export function useCalendarDialogs(churchId: string | null, isEventManager: boolean, form: any) {
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EventType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDayEventsDialogOpen, setIsDayEventsDialogOpen] = useState(false);

  const isEditing = editEvent !== null;

  function handleEdit(event: EventType) {
    if (!isEventManager) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to edit events.',
        variant: 'destructive',
      });
      return;
    }

    setEditEvent(event);
    form.reset({
      title: event.title,
      description: event.description ?? '',
      date: event.date,
    });
    setIsDayEventsDialogOpen(false);
    setIsFormOpen(true);
  }

  function handleAdd(date: Date) {
    if (!isEventManager) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to add events.',
        variant: 'destructive',
      });
      return;
    }

    setEditEvent(null);
    form.reset({
      title: '',
      description: '',
      date,
    });
    setIsDayEventsDialogOpen(false);
    setIsFormOpen(true);
  }

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

  async function onSubmit(data: any) {
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

    try {
      if (isEditing && editEvent) {
        const ref = doc(db, 'churches', churchId, 'events', editEvent.id);
        await updateDoc(ref, {
          title: data.title,
          description: data.description ?? '',
          date: data.date,
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
          date: data.date,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        toast({
          title: 'Event Added',
          description: `"${data.title}" has been added to ${format(data.date, 'PPP')}.`,
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
