'use client';

import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { EventFormDialog } from './EventFormDialog';
import { DayEventsDialog } from './DayEventsDialog';

interface CalendarDialogsProps {
  dialogs: {
    isFormOpen: boolean;
    isEditing: boolean;
    editEvent: any;
    deleteId: string | null;
    selectedDate: Date | null;
    isDayEventsDialogOpen: boolean;

    setIsFormOpen: (v: boolean) => void;
    setEditEvent: (v: any) => void;
    setDeleteId: (v: string | null) => void;
    setSelectedDate: (v: Date | null) => void;
    setIsDayEventsDialogOpen: (v: boolean) => void;

    handleEdit: (event: any) => void;
    handleAdd: (date: Date) => void;
    handleDelete: (id: string) => Promise<void>;
    onSubmit: (data: any) => Promise<void>;
  };

  selectedDayEvents: any[];
  form: any;
  muiTheme: any;
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
          if (!open) editEvent(null);
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
