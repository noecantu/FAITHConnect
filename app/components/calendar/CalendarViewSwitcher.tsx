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

  // Unified permission flag
  canManage: boolean;

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
  canManage,
  onEdit,
  onDeleteRequest,
}: CalendarViewSwitcherProps) {

  // Stable edit handler
  const handleEdit = useCallback(
    (event: Event) => {
      if (!canManage) return;
      if (!onEdit) return;
      onEdit(event);
    },
    [canManage, onEdit]
  );

  // Stable delete handler
  const handleDelete = useCallback(
    (id: string) => {
      if (!canManage) return;
      if (!onDeleteRequest) return;
      onDeleteRequest(id);
    },
    [canManage, onDeleteRequest]
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
          onEdit={canManage ? handleEdit : undefined}
        />
      );
    }

    return (
      <ListView
        events={events}
        onEdit={canManage ? handleEdit : undefined}
        onDeleteRequest={canManage ? handleDelete : undefined}
      />
    );
  }, [
    view,
    month,
    events,
    onSelectDate,
    onPrevMonth,
    onNextMonth,
    canManage,
    handleEdit,
    handleDelete,
  ]);
}
