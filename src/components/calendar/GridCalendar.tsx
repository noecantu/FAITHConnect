import * as React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Event } from "@/lib/types";
import { dateKey, groupEventsByDay } from "@/lib/calendar/utils";

interface GridCalendarProps {
  month: Date;
  selectedDate?: Date;
  onSelect: (d: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  events: Event[];
  weekStartsOn?: 0 | 1;
}

export function GridCalendar({
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
      ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <Card className="min-w-0">
      <CardHeader className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={onPrevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-center min-w-0">
            <CardTitle className="text-lg sm:text-xl">
              {format(month, "MMMM yyyy")}
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
                  "group relative rounded-md border p-1 sm:p-2",
                  "flex flex-col items-stretch justify-between",
                  isOutside ? "bg-muted/30 text-muted-foreground" : "bg-card",
                  isSelected
                    ? "ring-2 ring-primary/70"
                    : "hover:bg-accent hover:text-accent-foreground",
                  today ? "outline outline-2 outline-primary/50" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={[
                      "text-xs sm:text-sm font-medium",
                      today ? "text-primary" : "",
                    ].join(" ")}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {count > 0 && (
                  <span
                    className={[
                      "pointer-events-none absolute bottom-1 right-1 rounded-full px-2 py-0.5 text-[10px] sm:text-xs",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    {count > 99 ? "99+" : count}
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