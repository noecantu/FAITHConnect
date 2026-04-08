'use client';

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isPast,
  isToday,
} from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Event, ServicePlan } from '@/app/lib/types';
import { dateKey } from '@/app/lib/calendar/utils';
import { getGroupColor } from "@/app/lib/groupColors";

interface GridCalendarProps {
  month: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  events: (Event | ServicePlan)[];
  onEdit?: (event: Event | ServicePlan) => void;
}

export function GridCalendar({
  month,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  events,
}: GridCalendarProps) {  

  const eventsByDay = events.reduce((acc, item) => {
    const key = dateKey(item.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, (Event | ServicePlan)[]>);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const leadingBlanks = getDay(monthStart);
  const trailingBlanks = 6 - getDay(monthEnd);

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }).map(() => null),
    ...monthDays,
    ...Array.from({ length: trailingBlanks }).map(() => null),
  ];

  return (
    <Card
      className="
        relative 
        bg-black/40 
        border-white/10 
        backdrop-blur-2xl 
        shadow-2xl 
        rounded-xl 
        overflow-hidden
        before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent
      "
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onPrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <CardTitle className="text-center text-lg sm:text-xl">
          {format(month, 'MMMM yyyy')}
        </CardTitle>

        <Button variant="ghost" size="icon" onClick={onNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent>
        {/* Weekday Header */}
        <div
          className="
            grid grid-cols-7 
            text-center text-xs font-semibold tracking-wide uppercase
            text-white/70 
            bg-white/5 
            backdrop-blur-sm 
            border-b border-white/10 
            py-2
          "
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div
          key={format(month, 'yyyy-MM')}
          className="grid grid-cols-7 border-t border-l animate-fadeIn"
        >
          {cells.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`blank-${index}`}
                  className="border-r border-b aspect-square"
                />
              );
            }

            const dayEvents = (eventsByDay[dateKey(day)] || []).sort((a, b) => {
              const timeA =
                "timeString" in a
                  ? new Date(`${a.dateString}T${a.timeString}`)
                  : a.date;

              const timeB =
                "timeString" in b
                  ? new Date(`${b.dateString}T${b.timeString}`)
                  : b.date;

              return timeA.getTime() - timeB.getTime();
            });

            const count = dayEvents.length;

            const dayClass = [
              "relative flex flex-col items-start justify-start p-2 border-r border-b aspect-square overflow-hidden",
              "transition-all duration-150",
              "hover:bg-white/10 hover:shadow-lg hover:z-10 hover:scale-[1.02]",
              isToday(day)
                ? "bg-primary/20 ring-2 ring-primary/40 ring-offset-1 ring-offset-black"
                : "",
              isPast(day) && !isToday(day)
                ? "bg-white/5 text-white/40"
                : "",
            ].join(" ");

            return (
              <button
                key={day.toString()}
                className={dayClass}
                onClick={() => onSelectDate(day)}
              >
                <span className="text-sm font-medium">{format(day, 'd')}</span>

                {/* Mobile count bubble */}
                {count > 0 && (
                  <div className="
                    md:hidden absolute bottom-1 right-1 text-xs rounded-full 
                    h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center 
                    text-[10px] bg-primary text-primary-foreground
                  ">
                    {count}
                  </div>
                )}

                {/* Desktop event chips */}
                {count > 0 && (
                  <div className="hidden md:flex flex-col items-start w-full mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => {
                      const groups = "groups" in event ? event.groups : [];
                      const color = getGroupColor(groups);

                      return (
                        <div
                          key={`${event.id}-${event.dateString}-${"timeString" in event ? "service" : "event"}`}
                          className="
                            text-xs text-white 
                            rounded-sm px-2 py-0.5
                            truncate w-full text-left 
                            shadow-sm 
                            border border-white/10
                          "
                          style={{ backgroundColor: color }}
                        >
                          {"timeString" in event
                            ? `${format(new Date(`${event.dateString}T${event.timeString}`), "h:mm a")} — ${event.title}`
                            : `${format(event.date, "h:mm a")} — ${event.title}`}
                        </div>
                      );
                    })}

                    {count > 2 && (
                      <div className="text-xs text-muted-foreground">
                        + {count - 2} more
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
