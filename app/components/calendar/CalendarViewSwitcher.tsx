'use client';

import { useCallback, useMemo } from "react";
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

  // Permission logic
  const canEditEvent = useCallback(
    (event: Event) => {
      if (isAdmin) return true;
      if (managerGroup && event.groups?.includes(managerGroup)) return true;
      return false;
    },
    [isAdmin, managerGroup]
  );

  // Stable edit handler
  const handleEdit = useCallback(
    (event: Event) => {
      if (!onEdit) return;
      if (canEditEvent(event)) onEdit(event);
    },
    [onEdit, canEditEvent]
  );

  // Stable delete handler
  const handleDelete = useCallback(
    (id: string) => {
      if (!onDeleteRequest) return;

      const event = events.find((e) => e.id === id);
      if (!event) return;

      if (canEditEvent(event)) onDeleteRequest(id);
    },
    [events, onDeleteRequest, canEditEvent]
  );

  // Memoized render
  return useMemo(() => {
    if (view === "calendar") {
      return (
        <GridCalendar
          month={month}
          events={events}
          onSelect={onSelectDate}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onEdit={handleEdit}
        />
      );
    }

    return (
      <ListView
        events={events}
        onEdit={handleEdit}
        onDeleteRequest={handleDelete}
      />
    );
  }, [
    view,
    month,
    events,
    onSelectDate,
    onPrevMonth,
    onNextMonth,
    handleEdit,
    handleDelete,
  ]);
}
