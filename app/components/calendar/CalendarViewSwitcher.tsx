'use client';

import { useCallback, useMemo } from "react";
import { GridCalendar } from "./GridCalendar";
import { ListView } from "./ListView";
import type { Event, ServicePlan } from "@/app/lib/types";

type CalendarItem =
  | (Event & { type: "event" })
  | (ServicePlan & { type: "service" });

interface CalendarViewSwitcherProps {
  view: "calendar" | "list";

  month: Date;
  events: CalendarItem[];
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;

  canManage: boolean;

  onEdit?: (event: CalendarItem) => void;
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

  const handleEdit = useCallback(
    (item: CalendarItem) => {
      if (!onEdit) return;
      onEdit(item);
    },
    [onEdit]
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (!canManage) return;
      if (!onDeleteRequest) return;
      onDeleteRequest(id);
    },
    [canManage, onDeleteRequest]
  );

  return useMemo(() => {
    if (view === "calendar") {
      return (
        <GridCalendar
          month={month}
          events={events}
          onSelectDate={onSelectDate}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
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
