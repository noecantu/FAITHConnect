'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { PageHeader } from '@/app/components/page-header';
import { Fab } from '@/app/components/ui/fab';
import { Button } from '@/app/components/ui/button';
import { Calendar, List } from 'lucide-react';

import { useAuth } from '@/app/hooks/useAuth';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';

import { useCalendarEvents } from '@/app/hooks/useCalendarEvents';
import { useCalendarMonth } from '@/app/hooks/useCalendarMonth';
import { useCalendarFilters } from '@/app/hooks/useCalendarFilters';
import { useCalendarDialogs } from '@/app/hooks/useCalendarDialogs';

import { CalendarControls } from '@/app/components/calendar/CalendarControls';
import { CalendarDialogs } from '@/app/components/calendar/CalendarDialogs';

import { dateKey } from '@/app/lib/calendar/utils';
import { createTheme } from '@mui/material/styles';
import { can } from '@/app/lib/auth/permissions/can';
import { CalendarViewSwitcher } from '@/app/components/calendar/CalendarViewSwitcher';
import { useUserCalendarSettings } from '@/app/hooks/useUserCalendarSettings';

// ------------------------------
// Schema
// ------------------------------
const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.date(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
  groups: z.array(z.string()).optional(),
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
  const { churchId } = useChurchId();
  const { user } = useAuth();
  const { roles = [] } = useUserRoles();
  const { view, setView } = useUserCalendarSettings(user?.id ?? null);

  // ADMIN CHECK
  const isAdmin =
    can(roles, "church.manage") ||
    can(roles, "system.manage");

  // MANAGER GROUP CHECK
  let managerGroup: string | null = null;

  if (can(roles, "music.manage")) managerGroup = "music";
  else if (can(roles, "usher.manage")) managerGroup = "usher";
  else if (can(roles, "caretaker.manage")) managerGroup = "caretaker";
  else if (can(roles, "men.manage")) managerGroup = "men";
  else if (can(roles, "women.manage")) managerGroup = "women";
  else if (can(roles, "youth.manage")) managerGroup = "youth";
  else if (can(roles, "events.manage")) managerGroup = "events";

  const canCreateEvents = isAdmin || !!managerGroup;

  // MEMBER GROUPS (read-level)
  const memberGroups: string[] = [];

  if (can(roles, "music.read")) memberGroups.push("music");
  if (can(roles, "usher.read")) memberGroups.push("ushers");
  if (can(roles, "caretaker.read")) memberGroups.push("caretaker");
  if (can(roles, "men.read")) memberGroups.push("mens");
  if (can(roles, "women.read")) memberGroups.push("womens");
  if (can(roles, "youth.read")) memberGroups.push("youth");

  // DATA
  const { events } = useCalendarEvents(
    churchId,
    user?.id ?? null,
    isAdmin,
    managerGroup,
    memberGroups,
  );

  const month = useCalendarMonth();
  const filters = useCalendarFilters(events);

  // FORM + DIALOGS
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: new Date(),
      isPublic: false,
      groups: [],
    },
  });

  const dialogs = useCalendarDialogs(
    churchId,
    isAdmin,
    managerGroup,
    form
  );

  // Selected day events
  const selectedDayEvents = (() => {
    const d = dialogs.selectedDate;
    if (!d) return [];
    return events.filter((e) => dateKey(e.date) === dateKey(d));
  })();

  // Build view controls object for CalendarControls (matches its original API)
  const viewControls = {
    view,
    setView,
  };

  return (
    <>
      <PageHeader
        title="Calendar of Events"
        subtitle="Select a date to view or add events."
      >
        <div className="flex items-center gap-2">
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("calendar")}
          >
            <Calendar className="h-5 w-5" />
          </Button>

          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("list")}
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </PageHeader>

      <CalendarControls
        month={month}
        view={viewControls}
        filters={filters}
        user={user}
      />

      <CalendarViewSwitcher
        view={view}
        month={month.month}
        events={filters.filtered}
        onSelectDate={dialogs.handleSelectDate}
        onPrevMonth={month.prevMonth}
        onNextMonth={month.nextMonth}
        isAdmin={isAdmin}
        managerGroup={managerGroup}
        onEdit={dialogs.handleEdit}
        onDeleteRequest={dialogs.setDeleteId}
      />

      <CalendarDialogs
        dialogs={dialogs}
        selectedDayEvents={selectedDayEvents}
        form={form}
        muiTheme={muiTheme}
        isAdmin={isAdmin}
        managerGroup={managerGroup}
      />

      {canCreateEvents && (
        <Fab type="add" onClick={() => dialogs.handleAdd(new Date())} />
      )}
    </>
  );
}
