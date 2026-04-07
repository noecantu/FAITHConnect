'use client';

import { format, setMonth as setMonthDate, setYear as setYearDate } from 'date-fns';
import { Button } from '../ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';
import { SearchBar } from '../ui/search-bar';

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

  const years = Array.from(
    new Set(events.map(e => e.date.getFullYear()))
  ).sort((a, b) => a - b);

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
          <div className="flex flex-row items-center justify-end gap-2 w-full">

            {/* Month */}
            <Select
              value={String(month.month.getMonth())}
              onValueChange={(value) =>
                month.setMonth(setMonthDate(month.month, Number(value)))
              }
            >
              <SelectTrigger
                className="
                  w-[140px] h-9
                  bg-black/40 border border-white/30 backdrop-blur-xl
                  text-white/80
                  hover:bg-white/5 hover:border-white/30
                  transition
                  sm:w-[140px]
                  max-sm:flex-1
                "
              >
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
              <SelectTrigger
                className="
                  w-[140px] h-9
                  bg-black/40 border border-white/30 backdrop-blur-xl
                  text-white/80
                  hover:bg-white/5 hover:border-white/30
                  transition
                  sm:w-[140px]
                  max-sm:flex-1
                "
              >
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
              variant="ghost"
              onClick={month.goToday}
              className="
                bg-black/30 border border-white/30 backdrop-blur-xl
                whitespace-nowrap
              "
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
              <SearchBar
                value={filters.search}
                onChange={filters.setSearch}
                placeholder="Search Events…"
              />
            </div>

            {/* Filter + Sort */}
            <div className="flex flex-col gap-3 min-[400px]:flex-row min-[400px]:gap-4 md:justify-end">

              <Select
                value={filters.filter}
                onValueChange={(v) => filters.setFilter(v as any)}
              >
                <SelectTrigger
                  className="
                    h-9
                    w-full min-[400px]:w-[140px]
                    bg-black/40 border border-white/30 backdrop-blur-xl
                    text-white/80
                    hover:bg-white/5 hover:border-white/20
                    transition
                  "
                >
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
                <SelectTrigger
                  className="
                    h-9
                    w-full min-[400px]:w-[140px]
                    bg-black/40 border border-white/30 backdrop-blur-xl
                    text-white/80
                    hover:bg-white/5 hover:border-white/20
                    transition
                  "
                >
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
