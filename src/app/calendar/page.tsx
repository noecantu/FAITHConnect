'use client';

import * as React from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { events as initialEvents } from '@/lib/data';
import type { Event as EventType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

// ------------------------------
// Schema & Types
// ------------------------------
const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.date({ required_error: 'Date is required' }),
  description: z.string().optional(),
});
type EventFormValues = z.infer<typeof eventSchema>;

// ------------------------------
// Utilities
// ------------------------------
function dateKey(d: Date) {
  return format(d, 'yyyy-MM-dd');
}
function groupEventsByDay(events: EventType[]) {
  const map = new Map<string, EventType[]>();
  for (const e of events) {
    const key = dateKey(e.date);
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  return map;
}

// ------------------------------
// List View Component
// ------------------------------
function ListView({ events }: { events: EventType[] }) {
  const grouped = React.useMemo(() => {
    const map = new Map<string, EventType[]>();
    for (const e of events) {
      const key = format(e.date, 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [events]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Events</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {grouped.map(([day, evts]) => (
          <div key={day}>
            <h3 className="font-semibold mb-2">{format(new Date(day), 'PPP')}</h3>
            <ul className="space-y-2">
              {evts.map((e) => (
                <li key={e.id} className="border rounded-md p-3">
                  <div className="font-medium">{e.title}</div>
                  {e.description && (
                    <div className="text-sm text-muted-foreground">
                      {e.description}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ------------------------------
// GridCalendar Component (unchanged)
// ------------------------------
interface GridCalendarProps {
  month: Date;
  selectedDate?: Date;
  onSelect: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  events: EventType[];
  weekStartsOn?: 0 | 1;
}

function GridCalendar({
  month,
  selectedDate,
  onSelect,
  onPrevMonth,
  onNextMonth,
  events,
  weekStartsOn = 0,
}: GridCalendarProps) {
  const eventsByDay = React.useMemo(() => groupEventsByDay(events), [events]);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn });

  const days: Date[] = [];
  for (let d = gridStart; d <= gridEnd; d = addDays(d, 1)) {
    days.push(d);
  }

  const weekDayLabels =
    weekStartsOn === 1
      ? ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
      : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <Card className="min-w-0">
      <CardHeader className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onPrevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center min-w-0">
            <CardTitle className="text-lg sm:text-xl">
              {format(month, 'MMMM yyyy')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Tap a day to view or add events
            </CardDescription>
          </div>

          <Button variant="ghost" size="icon" onClick={onNextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-2 px-1 text-center text-xs font-medium text-muted-foreground sm:text-sm">
          {weekDayLabels.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:px-3">
        <div className="grid grid-cols-7 gap-2 [grid-auto-rows:minmax(56px,1fr)] sm:[grid-auto-rows:minmax(84px,1fr)]">
          {days.map((day) => {
            const isOutside = !isSameMonth(day, month);
            const isSelected = !!selectedDate && isSameDay(day, selectedDate);
            const today = isSameDay(day, new Date());

            const dayEvents = eventsByDay.get(dateKey(day)) ?? [];
            const count = dayEvents.length;

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelect(day)}
                className={[
                  'group relative rounded-md border p-1 sm:p-2',
                  'flex flex-col items-stretch justify-between',
                  isOutside ? 'bg-muted/30 text-muted-foreground' : 'bg-card',
                  isSelected
                    ? 'ring-2 ring-primary/70'
                    : 'hover:bg-accent hover:text-accent-foreground',
                  today ? 'outline outline-2 outline-primary/50' : '',
                ].join(' ')}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={[
                      'text-xs sm:text-sm font-medium',
                      today ? 'text-primary' : '',
                    ].join(' ')}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {count > 0 && (
                  <span
                    className={[
                      'pointer-events-none absolute bottom-1 right-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    ].join(' ')}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ------------------------------
// Page Component
// ------------------------------
export default function CalendarPage() {
  const [month, setMonth] = React.useState<Date>(startOfMonth(new Date()));
  const [selected, setSelected] = React.useState<Date>(new Date());
  const [events, setEvents] = React.useState<EventType[]>(initialEvents);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const { toast } = useToast();

  // Load user preference from Settings
  const [view, setView] = React.useState<'calendar' | 'list'>('calendar');
  React.useEffect(() => {
    const saved = localStorage.getItem('calendarView');
    if (saved === 'calendar' || saved === 'list') {
      setView(saved);
    }
  }, []);

  const selectedDayEvents = React.useMemo(() => {
    return events.filter((event) => dateKey(event.date) === dateKey(selected));
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

  function onSubmit(data: EventFormValues) {
    const newEvent: EventType = {
      id: `e${events.length + 1}`,
      ...data,
    };
    setEvents((prev) => [...prev, newEvent]);
    toast({
      title: 'Event Added',
      description: `"${data.title}" has been added to ${format(data.date, 'PPP')}.`,
    });
    setIsFormOpen(false);
    form.reset({ title: '', description: '', date: selected });
  }

  return (
    <>
      <PageHeader title="Calendar of Events">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Event
            </Button>
          </DialogTrigger>

          <DialogContent
            className="
              flex flex-col bg-background p-0
              !left-0 !top-0 !-translate-x-0 !-translate-y-0
              w-[100vw] h-[100dvh] max-h-[100dvh]
              sm:!left-1/2 sm:!top-1/2 sm:!-translate-x-1/2 sm:!-translate-y-1/2
              sm:w-[min(640px,calc(100vw-2rem))] sm:max-h-[85vh]
            "
            onOpenAutoFocus={(e) => e.preventDefault()}
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <DialogHeader className="shrink-0 px-4 py-4 sm:px-6">
              <DialogTitle>Add New Event</DialogTitle>
              <DialogDescription>
                Add a new event for {format(selected, 'PPP')}.
              </DialogDescription>
            </DialogHeader>

            <div className="grow overflow-y-auto px-4 sm:px-6 pb-[calc(var(--footer-h,3.5rem)+env(safe-area-inset-bottom)+0.75rem)]">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Sunday Service" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Event details..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="text" value={format(field.value, 'PPP')} readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>

            <DialogFooter
              className="shrink-0 px-4 py-3 sm:px-6"
              style={{ ['--footer-h' as any]: '3.5rem' }}
            >
              <Button type="submit" onClick={form.handleSubmit(onSubmit)} className="w-full sm:w-auto">
                Add Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button variant="outline" onClick={handleNextMonth}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
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
                        <li key={event.id} className="rounded-md border p-3">
                          <p className="font-semibold">{event.title}</p>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(event.date, 'PPP')}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No events for this day.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : (
        <ListView events={events} />
      )}
    </>
  );
}