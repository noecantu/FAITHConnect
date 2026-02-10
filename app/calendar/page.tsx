'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { PageHeader } from '../components/page-header';
import { Fab } from '../components/ui/fab';

import { useAuth } from '../hooks/useAuth';
import { useChurchId } from '../hooks/useChurchId';
import { useUserRoles } from '../hooks/useUserRoles';
import { useSettings } from '../hooks/use-settings';

import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { useCalendarMonth } from '../hooks/useCalendarMonth';
import { useCalendarView } from '../hooks/useCalendarView';
import { useCalendarFilters } from '../hooks/useCalendarFilters';
import { useCalendarDialogs } from '../hooks/useCalendarDialogs';

import { CalendarControls } from '../components/calendar/CalendarControls';
import { CalendarViewSwitcher } from '../components/calendar/CalendarViewSwitcher';
import { CalendarDialogs } from '../components/calendar/CalendarDialogs';

import { dateKey } from '../lib/calendar/utils';
import { createTheme } from '@mui/material/styles';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';

// ------------------------------
// Schema
// ------------------------------
const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.date(),
  description: z.string().optional(),
});
type EventFormValues = z.infer<typeof eventSchema>;

// ------------------------------
// MUI Theme
// ------------------------------
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
  const churchId = useChurchId();
  const { user } = useAuth();
  const { isEventManager } = useUserRoles(churchId);
  const { calendarView } = useSettings();

  // Data
  const { events } = useCalendarEvents(churchId, user?.id ?? null);

  // Month navigation
  const month = useCalendarMonth();

  // View mode
  const view = useCalendarView(calendarView);

  // Form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: new Date(),
    },
  });

  // Dialogs (add/edit/delete/day)
  const dialogs = useCalendarDialogs(churchId, isEventManager, form);

  // Filters (search, sort, future/past)
  const filters = useCalendarFilters(events);

  // Selected day events
  const selectedDayEvents = (() => {
    const d = dialogs.selectedDate;
    if (!d) return [];
    return events.filter((e) => dateKey(e.date) === dateKey(d));
  })();

  return (
    <div className="space-y-6 p-6">

      {/* PAGE HEADER — unchanged except for radio buttons */}
      <PageHeader
        title="Calendar of Events"
        subtitle="Select a date to view or add events."
      >
        {/* View Selector — added back here, Members-style */}
        <div className="flex items-center gap-4">
          <RadioGroup
            value={view.view}
            onValueChange={(v: "calendar" | "list") => view.setView(v)}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-1">
              <RadioGroupItem value="calendar" id="view-calendar" />
              <label htmlFor="view-calendar" className="text-sm">Calendar</label>
            </div>

            <div className="flex items-center gap-1">
              <RadioGroupItem value="list" id="view-list" />
              <label htmlFor="view-list" className="text-sm">List</label>
            </div>
          </RadioGroup>
        </div>
      </PageHeader>

      {/* ORIGINAL CONTROLS — fully restored */}
      <CalendarControls
        month={month}
        view={view}
        filters={filters}
        user={user}
      />

      {/* ORIGINAL VIEW SWITCHER — unchanged */}
      <CalendarViewSwitcher
        view={view.view}
        month={month.month}
        events={filters.filtered}
        onSelectDate={dialogs.handleSelectDate}
        onPrevMonth={month.prevMonth}
        onNextMonth={month.nextMonth}
        onToday={month.goToday}
        canManage={isEventManager}
        onEdit={dialogs.handleEdit}
        onDeleteRequest={dialogs.setDeleteId}
      />

      {/* ORIGINAL DIALOGS — unchanged */}
      <CalendarDialogs
        dialogs={dialogs}
        selectedDayEvents={selectedDayEvents}
        form={form}
        muiTheme={muiTheme}
        canManage={isEventManager}
      />

      {/* ORIGINAL FAB — unchanged */}
      {isEventManager && (
        <Fab type="add" onClick={() => dialogs.handleAdd(new Date())} />
      )}
    </div>
  );
}
