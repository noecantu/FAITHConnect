'use client';

import {
  format,
  startOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isPast,
  isToday,
} from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Event } from '../../lib/types';
import { dateKey } from '../../lib/calendar/utils';

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
  const eventsByDay = events.reduce((acc, event) => {
    const key = dateKey(event.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const start = startOfWeek(month, { weekStartsOn: 0 });

  const days = Array.from({ length: 42 }).map((_, i) => addDays(start, i));

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
        <div className="grid grid-cols-7 text-center text-sm font-semibold text-muted-foreground">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-t border-l">
          {days.map((day) => {
            const dayEvents = eventsByDay[dateKey(day)] || [];
            const count = dayEvents.length;
            const isCurrentMonth = isSameMonth(day, month);

            const dayClass = [
              'relative flex flex-col items-start justify-start p-1 sm:p-2 border-r border-b aspect-square overflow-hidden',
              isCurrentMonth ? '' : 'text-muted-foreground opacity-50',
              !isCurrentMonth && isPast(day) && !isToday(day) ? 'bg-muted/30' : '',
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
                
                {/* On small screens, show event count */}
                {count > 0 && (
                  <div className="md:hidden absolute bottom-1 right-1 text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                    {count}
                  </div>
                )}

                {/* On larger screens, show event titles */}
                {count > 0 && (
                    <div className="hidden md:flex flex-col items-start w-full mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map(event => (
                            <div key={event.id} className="text-xs bg-primary/20 text-white rounded-sm px-1 truncate w-full text-left">
                                {event.title}
                            </div>
                        ))}
                        {count > 2 && (
                            <div className="text-xs text-muted-foreground">+ {count - 2} more</div>
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
