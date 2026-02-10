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
  canManage,
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
  canManage: boolean;
  onEdit?: (e: Event) => void;
  onDeleteRequest?: (id: string) => void;
}) {
  if (view === 'calendar') {
    return (
      <GridCalendar
        month={month}
        onSelect={onSelectDate}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        events={events}
      />
    );
  }

  return (
    <ListView
      events={events}
      onEdit={canManage ? onEdit : undefined}
      onDeleteRequest={canManage ? onDeleteRequest : undefined}
    />
  );
}
