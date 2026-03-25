'use client';

import { GridCalendar } from './GridCalendar';
import { ListView } from './ListView';

import type { Event } from "@/app/lib/types";

export function CalendarViewSwitcher({
  view,
  month,
  events,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  isAdmin,
  managerGroup,
  onEdit,
  onDeleteRequest,
}: {
  view: "calendar" | "list";
  month: Date;
  events: Event[];
  onSelectDate: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  isAdmin: boolean;
  managerGroup: string | null;
  onEdit?: (e: Event) => void;
  onDeleteRequest?: (id: string) => void;
}) {

  function canEditEvent(event: Event) {
    if (isAdmin) return true;
    if (managerGroup && event.groups?.includes(managerGroup)) return true;
    return false;
  }

  if (view === 'calendar') {
    return (
      <GridCalendar
        month={month}
        onSelect={onSelectDate}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        events={events}
        onEdit={(event) => {
          if (onEdit && canEditEvent(event)) {
            onEdit(event);
          }
        }}
      />
    );
  }

  return (
    <ListView
      events={events}
      onEdit={(event) => {
        if (onEdit && canEditEvent(event)) {
          onEdit(event);
        }
      }}
      onDeleteRequest={(id) => {
        const event = events.find((e) => e.id === id);
        if (event && onDeleteRequest && canEditEvent(event)) {
          onDeleteRequest(id);
        }
      }}
    />
  );
}
