'use client';

import * as React from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  isSameMonth,
} from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import type { Event as EventType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { createTheme } from '@mui/material/styles';

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { useEffect } from 'react';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';

import { dateKey } from '@/lib/calendar/utils';
import { GridCalendar } from '@/components/calendar/GridCalendar';
import { ListView } from '@/components/calendar/ListView';
import { ConfirmDeleteDialog } from '@/components/calendar/ConfirmDeleteDialog';
import { EventFormDialog } from '@/components/calendar/EventFormDialog';

// ------------------------------
// Schema & Types
// ------------------------------
const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.date({ required_error: 'Date is required' }),
  description: z.string().optional(),
});
type EventFormValues = z.infer<typeof eventSchema>;

const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a0a0a',
      paper: '#0f0f0f',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255,255,255,0.7)',
    },
    primary: {
      main: '#4f46e5',
    },
  },
});

// ------------------------------
// Page Component
// ------------------------------
export default function CalendarPage() {
  const [month, setMonth] = React.useState<Date>(startOfMonth(new Date()));
  const [selected, setSelected] = React.useState<Date>(new Date());
  const [events, setEvents] = React.useState<EventType[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editEvent, setEditEvent] = React.useState<EventType | null>(null);
  const isEditing = editEvent !== null;
  const { toast } = useToast();
  const churchId = useChurchId();
  const { isEventManager } = useUserRoles(churchId);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const isDeleteOpen = deleteId !== null;

  // Firestore listener
  useEffect(() => {
    if (!churchId) return;

    const q = query(
      collection(db, 'churches', churchId, 'events'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: EventType[] = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data();

        return {
          id: docSnap.id,
          title: raw.title,
          description: raw.description,
          date: raw.date?.toDate?.() ?? new Date(),
        };
      });

      setEvents(data);
    });

    return () => unsubscribe();
  }, [churchId]);

  // View preference (calendar vs list)
  const [view, setView] = React.useState<'calendar' | 'list'>('calendar');
  React.useEffect(() => {
    const checkStorage = () => {
      const saved = localStorage.getItem('calendarView');
      if (saved === 'calendar' || saved === 'list') {
        setView(saved);
      }
    };

    checkStorage(); // Initial check

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'calendarView' && (e.newValue === 'calendar' || e.newValue === 'list')) {
        setView(e.newValue);
      }
    };

    const handleFocus = () => {
      checkStorage();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);


    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Hydration guard
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const selectedDayEvents = React.useMemo(() => {
    return events.filter(
      (event) => dateKey(event.date) === dateKey(selected)
    );
  }, [selected, events]);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: selected,
    },
  });

  React.useEffect(() => {
    form.setValue('date', selected);
  }, [selected, form]);

  function handleSelectDate(d: Date) {
    setSelected(d);
    if (!isSameMonth(d, month)) {
      setMonth(startOfMonth(d));
    }
  }

  function handlePrevMonth() {
    const m = subMonths(month, 1);
    setMonth(m);
    if (!isSameMonth(selected, m)) {
      setSelected(startOfMonth(m));
    }
  }

  function handleNextMonth() {
    const m = addMonths(month, 1);
    setMonth(m);
    if (!isSameMonth(selected, m)) {
      setSelected(startOfMonth(m));
    }
  }

  function handleDeleteRequest(id: string) {
    if (!isEventManager) {
      toast({
        title: 'Permission Denied',
        description: 'You do not have permission to delete events.',
        variant: 'destructive',
      });
      return;
    }
    setDeleteId(id);
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

    setSelected(event.date);
    setIsFormOpen(true);
  }

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

    try {
      if (isEditing && editEvent) {
        // UPDATE in Firestore
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
        // CREATE in Firestore
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
          description: `"${data.title}" has been added to ${format(
            data.date,
            'PPP'
          )}.`,
        });
      }

      setIsFormOpen(false);
      setEditEvent(null);

      form.reset({
        title: '',
        description: '',
        date: selected,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error saving event',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  }

  if (!hydrated) return null;

  return (
    <>
      {/* Delete confirmation */}
      <ConfirmDeleteDialog
        open={isDeleteOpen}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={async () => {
          if (deleteId) {
            await handleDelete(deleteId);
            setDeleteId(null);
          }
        }}
      />

      <PageHeader title="Calendar of Events">
        <div className="flex items-center gap-2">
          {isEventManager && (
            <Button
              onClick={() => {
                setEditEvent(null);
                form.reset({
                  title: '',
                  description: '',
                  date: selected,
                });
                setIsFormOpen(true);
              }}
            >
              Add Event
            </Button>
          )}
        </div>

        <EventFormDialog
          open={isFormOpen}
          isEditing={isEditing}
          event={editEvent}
          selectedDate={selected}
          form={form}
          onSubmit={onSubmit}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditEvent(null);
          }}
          muiTheme={muiTheme}
        />
      </PageHeader>

      {/* VIEW SWITCHING */}
      {view === 'calendar' ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-1 lg:col-span-2 min-w-0">
              <GridCalendar
                month={month}
                selectedDate={selected}
                onSelect={handleSelectDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                events={events}
                weekStartsOn={0}
              />

              <div className="mt-3 flex items-center justify-between">
                <Button variant="outline" onClick={handlePrevMonth}>
                  Previous
                </Button>
                <Button variant="outline" onClick={handleNextMonth}>
                  Next
                </Button>
              </div>
            </div>

            <div className="min-w-0">
              <Card>
                <CardHeader>
                  <CardTitle>Events for {format(selected, 'PPP')}</CardTitle>
                  <CardDescription>
                    Tap a day to view or add events.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDayEvents.length > 0 ? (
                    <ul className="space-y-4">
                      {selectedDayEvents.map((event) => (
                        <li key={event.id} className="flex items-center justify-between rounded-md border p-3">
                          <div className="flex-grow">
                            <p className="font-semibold">{event.title}</p>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {event.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(event.date, 'PPP')}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2 ml-4">
                            {isEventManager && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteRequest(event.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">
                      No events for this day.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <ListView
          events={events}
          onEdit={handleEdit}
          onDeleteRequest={handleDeleteRequest}
        />
      )}
    </>
  );
}
