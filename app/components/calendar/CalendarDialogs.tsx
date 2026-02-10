'use client';

import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { EventFormDialog } from './EventFormDialog';
import { DayEventsDialog } from './DayEventsDialog';

import type { Event } from "@/app/lib/types";
import type { Theme } from "@mui/material/styles";
import type { UseFormReturn } from "react-hook-form";

interface EventFormValues {
  title: string;
  description?: string;
  date: Date;
}

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
  onSubmit: (data: EventFormValues) => Promise<void>;
}

interface CalendarDialogsProps {
  dialogs: CalendarDialogsState;
  selectedDayEvents: Event[];
  form: UseFormReturn<EventFormValues>;
  muiTheme: Theme;
  canManage: boolean;
}

export function CalendarDialogs({
  dialogs,
  selectedDayEvents,
  form,
  muiTheme,
  canManage,
}: CalendarDialogsProps) {
  const {
    isFormOpen,
    isEditing,
    editEvent,
    selectedDate,
    isDayEventsDialogOpen,
    deleteId,
    setDeleteId,
    setIsFormOpen,
    setIsDayEventsDialogOpen,
    setEditEvent,
    handleDelete,
    handleAdd,
    handleEdit,
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
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditEvent(null);
        }}
        muiTheme={muiTheme}
      />

      {selectedDate && (
        <DayEventsDialog
          open={isDayEventsDialogOpen}
          onOpenChange={setIsDayEventsDialogOpen}
          date={selectedDate}
          events={selectedDayEvents}
          onAdd={handleAdd}
          onEdit={handleEdit}
          onDelete={(id) => setDeleteId(id)}
          canManage={canManage}
        />
      )}
    </>
  );
}
