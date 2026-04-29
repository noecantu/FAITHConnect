'use client';

import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isPast,
  isToday,
  isValid,
  isSameDay,
} from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Event, ServicePlan } from '@/app/lib/types';
import { dateKey } from '@/app/lib/calendar/utils';
import { getGroupColor, getCalendarItemColor } from "@/app/lib/groupColors";

interface GridCalendarProps {
  month: Date;
  onSelectDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  events: (Event | ServicePlan)[];
  selectedDate?: Date;
  density?: 'comfortable' | 'compact';
  onEdit?: (event: Event | ServicePlan) => void;
}

export function GridCalendar({
  month,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  events,
  selectedDate,
  density = 'comfortable',
  onEdit,
}: GridCalendarProps) {  
  const isCompact = density === 'compact';

  const eventsByDay = events.reduce((acc, item) => {
    if (!isValid(item.date)) return acc;
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
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader className={isCompact ? "flex flex-row items-center justify-between py-3" : "flex flex-row items-center justify-between"}>
        <Button variant="ghost" size="icon" onClick={onPrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <CardTitle className={isCompact ? "text-center text-base sm:text-lg" : "text-center text-lg sm:text-xl"}>
          {format(month, 'MMMM yyyy')}
        </CardTitle>

        <Button variant="ghost" size="icon" onClick={onNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardHeader>

      <CardContent className={isCompact ? "px-3 pb-3 pt-0" : undefined}>
        {/* Weekday Header */}
        <div
          className={isCompact ? `
            grid grid-cols-7 
            text-center text-[10px] font-semibold tracking-wide uppercase
            text-white/60 
            bg-white/5 
            backdrop-blur-sm 
            border-b border-white/20 
            py-1
          ` : `
            grid grid-cols-7 
            text-center text-xs font-semibold tracking-wide uppercase
            text-white/70 
            bg-white/5 
            backdrop-blur-sm 
            border-b border-white/20 
            py-2
          `}
        >
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className={isCompact ? "py-1" : "py-2"}>
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
              "relative flex flex-col items-start justify-start border-r border-b aspect-square overflow-hidden",
              isCompact ? 'p-1' : 'p-2',
              "transition-all duration-150",
              isCompact ? "hover:bg-white/10" : "hover:bg-white/10 hover:shadow-lg hover:z-10 hover:scale-[1.02]",
              selectedDate && isSameDay(day, selectedDate)
                ? "ring-2 ring-sky-400/70 ring-inset"
                : "",
              isToday(day)
                ? "bg-primary/20 ring-2 ring-primary/40 ring-offset-1 ring-offset-black"
                : "",
              isPast(day) && !isToday(day)
                ? "bg-white/5 text-white/40"
                : "",
            ].join(" ");

            return (
              <div
                key={day.toString()}
                role="button"
                tabIndex={0}
                className={dayClass}
                onClick={() => onSelectDate(day)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectDate(day); }}
              >
                <span className={isCompact ? 'text-[11px] font-medium leading-none' : 'text-sm font-medium'}>{format(day, 'd')}</span>

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
                  <div className={isCompact ? 'hidden md:flex flex-col items-start w-full mt-1 space-y-1' : 'hidden md:flex flex-col items-start w-full mt-1 space-y-2'}>
                    {(isCompact ? dayEvents.slice(0, 1) : dayEvents.slice(0, 2)).map((event) => {
                      const groups = "groups" in event ? event.groups : [];
                      const isService = "sections" in event;
                      const color = getCalendarItemColor(groups, isService);

                      return (
                        <button
                          key={`${event.id}-${event.dateString}-${"timeString" in event ? "service" : "event"}`}
                          type="button"
                          className={isCompact ? "text-[10px] text-white/90 rounded-sm px-1.5 py-px truncate w-full text-left border border-white/15 leading-tight hover:brightness-110 transition-[filter]" : "text-xs text-white rounded-sm px-2 py-0.5 truncate w-full text-left shadow-sm border border-white/20 hover:brightness-110 transition-[filter]"}
                          style={{ backgroundColor: color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(event);
                          }}
                        >
                          {"timeString" in event
                            ? isCompact
                              ? `${format(new Date(`${event.dateString}T${event.timeString}`), "h:mma")} ${event.title}`
                              : `${format(new Date(`${event.dateString}T${event.timeString}`), "h:mm a")} - ${event.title}`
                            : `${format(event.date, "h:mm a")} - ${event.title}`}
                        </button>
                      );
                    })}

                    {count > (isCompact ? 1 : 2) && (
                      <div className={isCompact ? "text-[10px] text-white/55" : "text-xs text-muted-foreground"}>
                        + {count - (isCompact ? 1 : 2)} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
