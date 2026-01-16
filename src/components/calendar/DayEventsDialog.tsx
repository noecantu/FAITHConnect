'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Event } from '@/lib/types';

interface DayEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  events: Event[];
  onAdd: (date: Date) => void;
  onEdit: (event: Event) => void;
  onDelete: (id: string) => void;
  canManage: boolean;
}

export function DayEventsDialog({
  open,
  onOpenChange,
  date,
  events,
  onAdd,
  onEdit,
  onDelete,
  canManage,
}: DayEventsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[90vw] max-w-md p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 shrink-0">
          <DialogTitle>Events for {format(date, 'MMMM d, yyyy')}</DialogTitle>
          <DialogDescription>
            {events.length === 0
              ? 'No events scheduled for this day.'
              : `${events.length} event${events.length === 1 ? '' : 's'} scheduled.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto px-6">
          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between rounded-lg border p-3 bg-card"
                >
                  <div className="space-y-1 overflow-hidden mr-2">
                    <h4 className="font-semibold leading-none truncate">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(event)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onDelete(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
              No events to display
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 shrink-0 flex flex-row justify-end border-t">
          {canManage && (
            <Button onClick={() => onAdd(date)} className="w-full sm:w-auto">
              Add Event
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
