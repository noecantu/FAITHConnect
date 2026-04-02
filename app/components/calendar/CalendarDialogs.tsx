'use client';

import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { EventFormDialog } from './EventFormDialog';

import type { Event } from "@/app/lib/types";
import type { Theme } from "@mui/material/styles";
import type { UseFormReturn } from "react-hook-form";
import type { EventFormValues } from "./EventFormDialog";

interface CalendarDialogsState {
  isFormOpen: boolean;
  isEditing: boolean;
  editEvent: Event | null;
  deleteId: string | null;
  selectedDate: Date | null;
  isDayEventsDialogOpen: boolean;

  setIsFormOpen: (v: boolean) => void;
  setEditEvent: (v: Event | null) => void;
  setDeleteId: (v: string | null) => void;
  setSelectedDate: (v: Date | null) => void;
  setIsDayEventsDialogOpen: (v: boolean) => void;

  handleEdit: (event: Event) => void;
  handleAdd: (date: Date) => void;
  handleDelete: (id: string) => Promise<void>;
  onSubmit: (data: EventFormValues) => Promise<void> | void;
}

interface CalendarDialogsProps {
  dialogs: CalendarDialogsState;
  selectedDayEvents: Event[];
  form: UseFormReturn<EventFormValues>;
  muiTheme: Theme;

  // NEW unified permission flag
  canManage: boolean;
}

export function CalendarDialogs({
  dialogs,
  form,
  canManage,
}: CalendarDialogsProps) {
  const {
    isFormOpen,
    isEditing,
    editEvent,
    selectedDate,
    deleteId,
    setDeleteId,
    setIsFormOpen,
    setEditEvent,
    handleDelete,
    onSubmit,
  } = dialogs;

  return (
    <>
      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await handleDelete(deleteId);
            setDeleteId(null);
          }
        }}
      />

      <EventFormDialog
        open={isFormOpen}
        isEditing={isEditing}
        event={editEvent}
        selectedDate={selectedDate || new Date()}
        form={form}
        onSubmit={onSubmit}
        canManage={canManage}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditEvent(null);
        }}
        onDelete={(id) => setDeleteId(id)}
      />

    </>
  );
}
