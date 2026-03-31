'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { PageHeader } from '@/app/components/page-header';
import { Fab } from '@/app/components/ui/fab';
import { Button } from '@/app/components/ui/button';
import { Calendar, List } from 'lucide-react';

import { useChurchId } from '@/app/hooks/useChurchId';
import { useCalendarEvents } from '@/app/hooks/useCalendarEvents';
import { useCalendarMonth } from '@/app/hooks/useCalendarMonth';
import { useCalendarFilters } from '@/app/hooks/useCalendarFilters';
import { useCalendarDialogs } from '@/app/hooks/useCalendarDialogs';

import { CalendarControls } from '@/app/components/calendar/CalendarControls';
import { CalendarDialogs } from '@/app/components/calendar/CalendarDialogs';
import { CalendarViewSwitcher } from '@/app/components/calendar/CalendarViewSwitcher';

import { dateKey } from '@/app/lib/calendar/utils';
import { createTheme } from '@mui/material/styles';

import { canUser } from '@/app/lib/canUser';
import { Role } from '@/app/lib/roleGroups';
import { UserProfile } from '@/app/lib/types';

import { eventSchema, type EventFormValues } from "@/app/components/calendar/EventFormDialog";
import { useUserCalendarSettings } from '@/app/hooks/useUserCalendarSettings';

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

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Load user
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users/me");
      const raw = await res.json();

      const profile: UserProfile = {
        ...raw,
        roles: raw.roles as Role[],
      };

      setUser(profile);
      setLoadingUser(false);
    }

    load();
  }, []);

  // ❗ ALL HOOKS MUST RUN BEFORE ANY RETURN
  const canManage = canUser(user?.roles ?? [], "createEvents");

  const { events } = useCalendarEvents(churchId, user);
  const month = useCalendarMonth();
  const filters = useCalendarFilters(events);

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

  const dialogs = useCalendarDialogs(churchId, user, form);
  const { view, setView } = useUserCalendarSettings(user?.id ?? null);

  // Selected day events
  const selectedDayEvents = (() => {
    const d = dialogs.selectedDate;
    if (!d) return [];
    return events.filter((e) => dateKey(e.date) === dateKey(d));
  })();

  const viewControls = { view, setView };

  // ❗ NOW we can safely return early
  if (loadingUser) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6">No user found.</div>;

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
        onEdit={dialogs.handleEdit}
        onDeleteRequest={dialogs.setDeleteId}
        canManage={canManage}
      />

      <CalendarDialogs
        dialogs={dialogs}
        selectedDayEvents={selectedDayEvents}
        form={form}
        muiTheme={muiTheme}
        canManage={canManage}
      />

      {canManage && (
        <Fab type="add" onClick={() => dialogs.handleAdd(new Date())} />
      )}
    </>
  );
}
