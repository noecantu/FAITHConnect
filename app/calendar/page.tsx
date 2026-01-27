'use client';

import * as React from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  isSameMonth,
  setMonth as setMonthDate,
  setYear as setYearDate,
  startOfToday,
} from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { PageHeader } from '../components/page-header';
import { Button } from '../components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "../components/ui/select";

import type { Event as EventType } from '../lib/types';
import { useToast } from '../hooks/use-toast';

import { createTheme } from '@mui/material/styles';

import { db } from '../lib/firebase';
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
import { useChurchId } from '../hooks/useChurchId';
import { useUserRoles } from '../hooks/useUserRoles';

import { dateKey } from '../lib/calendar/utils';
import { GridCalendar } from '../components/calendar/GridCalendar';
import { ListView } from '../components/calendar/ListView';
import { ConfirmDeleteDialog } from '../components/calendar/ConfirmDeleteDialog';
import { EventFormDialog } from '../components/calendar/EventFormDialog';
import { DayEventsDialog } from '../components/calendar/DayEventsDialog';
import { Fab } from '../components/ui/fab';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useSettings } from '../hooks/use-settings';
import { useAuth } from '../hooks/useAuth';

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
  const [events, setEvents] = React.useState<EventType[]>([]);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editEvent, setEditEvent] = React.useState<EventType | null>(null);
  const isEditing = editEvent !== null;
  const { toast } = useToast();
  const churchId = useChurchId();
  const { isEventManager } = useUserRoles(churchId);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const isDeleteOpen = deleteId !== null;
  const { calendarView } = useSettings();

  // New state for the DayEventsDialog
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [isDayEventsDialogOpen, setIsDayEventsDialogOpen] = React.useState(false);
  const [view, setView] = React.useState<'calendar' | 'list'>(calendarView);
  const { user } = useAuth();
  
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
  // const [view, setView] = React.useState<'calendar' | 'list'>(() => {
  //   if (typeof window !== 'undefined') {
  //     const saved = localStorage.getItem('calendarView');
  //     if (saved === 'calendar' || saved === 'list') {
  //       return saved;
  //     }
  //   }
  //   return 'calendar';
  // });

  useEffect(() => {
    setView(calendarView);
  }, [calendarView]);
  
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

  const selectedDayEvents = React.useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(
      (event) => dateKey(event.date) === dateKey(selectedDate)
    );
  }, [selectedDate, events]);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: new Date(),
    },
  });

  function handleSelectDate(d: Date) {
    setSelectedDate(d);
    setIsDayEventsDialogOpen(true);
    if (!isSameMonth(d, month)) {
      setMonth(startOfMonth(d));
    }
  }

  function handlePrevMonth() {
    setMonth(prev => subMonths(prev, 1));
  }

  function handleNextMonth() {
    setMonth(prev => addMonths(prev, 1));
  }
  
  function handleToday() {
    setMonth(startOfToday());
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
    setIsDayEventsDialogOpen(false); // Close day view to open edit form
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
      date: date,
    });
    setIsDayEventsDialogOpen(false); // Close day view to open add form
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
          description: `"${data.title}" has been added to ${format(
            data.date,
            'PPP'
          )}.`,
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
  
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), 'MMMM'),
  }));
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <>
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
            onDelete={handleDeleteRequest}
            canManage={isEventManager}
        />
      )}

      <PageHeader 
        title="Calendar of Events"
        subtitle="Select a date to view or add events."
      >
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">

          {/* Month + Year Selectors */}
          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            {/* Month Select */}
            <Select
              value={String(month.getMonth())}
              onValueChange={(value) =>
                setMonth(setMonthDate(month, Number(value)))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year Select */}
            <Select
              value={String(month.getFullYear())}
              onValueChange={(value) =>
                setMonth(setYearDate(month, Number(value)))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Today + Divider + View Selector */}
          <div className="flex items-center gap-4">

            {/* Today Button */}
            <Button
              variant="outline"
              onClick={handleToday}
              className="w-full sm:w-auto"
            >
              Today
            </Button>

            {/* Perfectly centered vertical divider */}
            <div className="h-6 w-px bg-white/20" />

            {/* View Selector */}
            <RadioGroup
              value={view}
              onValueChange={async (value) => {
                const v = value as "calendar" | "list";
                setView(v);
              
                if (!user?.uid) return; // ⭐ prevents the TS error AND runtime crash
              
                await updateDoc(doc(db, "users", user.uid), {
                  "settings.calendarView": v,
                  updatedAt: serverTimestamp(),
                });
              }}              
              className="flex items-center gap-4"
            >
              <div className="flex items-center gap-1">
                <RadioGroupItem value="calendar" id="view-calendar" />
                <label htmlFor="view-calendar" className="text-sm">
                  Calendar
                </label>
              </div>

              <div className="flex items-center gap-1">
                <RadioGroupItem value="list" id="view-list" />
                <label htmlFor="view-list" className="text-sm">
                  List
                </label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </PageHeader>

      {/* VIEW SWITCHING */}
      {view === 'calendar' ? (
        <>
            <GridCalendar
                month={month}
                onSelect={handleSelectDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                events={events}
            />
        </>
      ) : (
        <ListView
          events={events}
          onEdit={handleEdit}
          onDeleteRequest={handleDeleteRequest}
        />
      )}

      {isEventManager && (
        <Fab
          type="add"
          onClick={() => {
            setEditEvent(null);
            form.reset({
              title: '',
              description: '',
              date: new Date(),
            });
            setIsFormOpen(true);
          }}
        />
      )}

    </>
  );
}
