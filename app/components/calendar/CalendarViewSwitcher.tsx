'use client';

import { GridCalendar } from "./GridCalendar";
import { ListView } from "./ListView";
import type { Event } from "@/app/lib/types";

interface CalendarViewSwitcherProps {
  view: "calendar" | "list";

  // Calendar props
  month: Date;
  events: Event[];
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;

  // Editing permissions
  isAdmin: boolean;
  managerGroup: string | null;
  onEdit?: (event: Event) => void;
  onDeleteRequest?: (id: string) => void;
}

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
}: CalendarViewSwitcherProps) {

  // -----------------------------
  // CALENDAR VIEW
  // -----------------------------
  if (view === "calendar") {
    return (
      <GridCalendar
        month={month}
        events={events}
        onSelect={onSelectDate}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onEdit={(event) => {
          if (!onEdit) return;

          // Permission check
          if (isAdmin) return onEdit(event);
          if (managerGroup && event.groups?.includes(managerGroup)) {
            return onEdit(event);
          }
        }}
      />
    );
  }

  // -----------------------------
  // LIST VIEW
  // -----------------------------
  return (
    <ListView
      events={events}
      onEdit={(event) => {
        if (!onEdit) return;

        if (isAdmin) return onEdit(event);
        if (managerGroup && event.groups?.includes(managerGroup)) {
          return onEdit(event);
        }
      }}
      onDeleteRequest={(id) => {
        if (!onDeleteRequest) return;

        const event = events.find((e) => e.id === id);
        if (!event) return;

        if (isAdmin) return onDeleteRequest(id);
        if (managerGroup && event.groups?.includes(managerGroup)) {
          return onDeleteRequest(id);
        }
      }}
    />
  );
}
