'use client';

import { format, setMonth as setMonthDate, setYear as setYearDate } from 'date-fns';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';

interface MonthControls {
  month: Date;
  setMonth: (d: Date) => void;
  prevMonth: () => void;
  nextMonth: () => void;
  goToday: () => void;
}

interface ViewControls {
  view: 'calendar' | 'list';
  setView: (v: 'calendar' | 'list') => void;
}

interface FilterControls {
  search: string;
  setSearch: (v: string) => void;
  filter: 'all' | 'future' | 'past';
  setFilter: (v: 'all' | 'future' | 'past') => void;
  sort: 'newest' | 'oldest';
  setSort: (v: 'newest' | 'oldest') => void;
}

interface CalendarControlsProps {
  events: { date: Date }[];
  month: MonthControls;
  view: ViewControls;
  filters: FilterControls;
  user: { id?: string } | null;
}

export function CalendarControls({
  events,
  month,
  view,
  filters,
}: CalendarControlsProps) {

  // ⭐ Extract available years from actual event data
  const years = Array.from(
    new Set(events.map(e => e.date.getFullYear()))
  ).sort((a, b) => a - b);

  // ⭐ Extract available months for the selected year
  const months = Array.from(
    new Set(
      events
        .filter(e => e.date.getFullYear() === month.month.getFullYear())
        .map(e => e.date.getMonth())
    )
  )
    .sort((a, b) => a - b)
    .map(m => ({
      value: m,
      label: format(new Date(0, m), 'MMMM'),
    }));

  return (
    <div className="space-y-4 mb-4">

      {/* CALENDAR VIEW CONTROLS */}
      {view.view === "calendar" && (
        <div className="flex justify-end w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">

            {/* Month */}
            <Select
              value={String(month.month.getMonth())}
              onValueChange={(value) =>
                month.setMonth(setMonthDate(month.month, Number(value)))
              }
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Year */}
            <Select
              value={String(month.month.getFullYear())}
              onValueChange={(value) =>
                month.setMonth(setYearDate(month.month, Number(value)))
              }
            >
              <SelectTrigger className="w-full sm:w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Today */}
            <Button
              variant="outline"
              onClick={month.goToday}
              className="w-full sm:w-20"
            >
              Today
            </Button>
          </div>
        </div>
      )}

      {/* LIST VIEW CONTROLS */}
      {view.view === 'list' && (
        <div className="flex flex-col gap-4 w-full">

          {/* Search + Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4 w-full">

            {/* Search */}
            <div className="w-full md:flex-1">
              <Input
                placeholder="Search events…"
                value={filters.search}
                onChange={(e) => filters.setSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Filter + Sort */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:justify-end">

              <Select
                value={filters.filter}
                onValueChange={(v) => filters.setFilter(v as any)}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="future">Future</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.sort}
                onValueChange={(v) => filters.setSort(v as any)}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="title">Title A–Z</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
