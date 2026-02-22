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
import type { Event } from '@/app/lib/types';
import { dateKey } from '@/app/lib/calendar/utils';

interface GridCalendarProps {
  month: Date;
  onSelect: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  events: Event[];
}

export function GridCalendar({
  month,
  onSelect,
  onPrevMonth,
  onNextMonth,
  events,
}: GridCalendarProps) {
  // Group events by day
  const eventsByDay = events.reduce((acc, event) => {
    const key = dateKey(event.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  // Real days of the month
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // How many blanks before the 1st (0 = Sunday, 6 = Saturday)
  const leadingBlanks = getDay(monthStart); // number of empty cells before day 1

  // How many blanks after the last day to complete the final week
  const trailingBlanks = 6 - getDay(monthEnd); // 0–6

  // Build the full grid: null = blank cell, Date = real day
  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }).map(() => null),
    ...monthDays,
    ...Array.from({ length: trailingBlanks }).map(() => null),
  ];

  return (
    <Card>
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
        {/* Weekday labels */}
        <div className="grid grid-cols-7 text-center text-sm font-semibold text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 border-t border-l">
          {cells.map((day, index) => {
            if (!day) {
              // Blank cell (padding before/after the month)
              return (
                <div
                  key={`blank-${index}`}
                  className="border-r border-b aspect-square"
                />
              );
            }

            const dayEvents = eventsByDay[dateKey(day)] || [];
            const count = dayEvents.length;

            const dayClass = [
              'relative flex flex-col items-start justify-start p-1 sm:p-2 border-r border-b aspect-square overflow-hidden',
              isPast(day) && !isToday(day) ? 'bg-muted/30' : '',
              isToday(day) ? 'bg-primary/10' : '',
              'hover:bg-muted',
            ].join(' ');

            return (
              <button
                key={day.toString()}
                className={dayClass}
                onClick={() => onSelect(day)}
              >
                <span className="text-sm font-medium">{format(day, 'd')}</span>

                {/* Mobile: event count */}
                {count > 0 && (
                  <div className="md:hidden absolute bottom-1 right-1 text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                    {count}
                  </div>
                )}

                {/* Desktop: event titles */}
                {count > 0 && (
                  <div className="hidden md:flex flex-col items-start w-full mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="text-xs bg-primary/20 text-white rounded-sm px-1 truncate w-full text-left"
                      >
                        {event.title}
                      </div>
                    ))}
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
