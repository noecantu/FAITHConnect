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
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// ---------------------------------------------
// TYPES
// ---------------------------------------------
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
  sort: 'newest' | 'oldest' | 'title';
  setSort: (v: 'newest' | 'oldest' | 'title') => void;
}

interface CalendarControlsProps {
  month: MonthControls;
  view: ViewControls;
  filters: FilterControls;
  user: { id?: string } | null;
}

// ---------------------------------------------
// COMPONENT
// ---------------------------------------------
export function CalendarControls({
  month,
  view,
  filters,
  user,
}: CalendarControlsProps) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(0, i), 'MMMM'),
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="space-y-4">

      {/* TOP CONTROLS — ONLY SHOW IN CALENDAR VIEW */}
      {view.view === "calendar" && (
        <div className="flex justify-end w-full">
          <div className="flex flex-col sm:flex-row items-center gap-2">

            {/* Month + Year */}
            <div className="grid grid-cols-2 gap-2">

              {/* Month */}
              <Select
                value={String(month.month.getMonth())}
                onValueChange={(value) =>
                  month.setMonth(setMonthDate(month.month, Number(value)))
                }
              >
                <SelectTrigger>
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
                <SelectTrigger>
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
            </div>

            {/* Today button */}
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={month.goToday}>
                Today
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LIST VIEW CONTROLS — unchanged */}
      {view.view === 'list' && (
        <div className="flex flex-col gap-4 w-full">

          {/* Row: Search + Dropdowns */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4 w-full">

            {/* SEARCH — ALWAYS FULL WIDTH ON MOBILE */}
            <div className="w-full md:flex-1">
              <Input
                placeholder="Search events…"
                value={filters.search}
                onChange={(e) => filters.setSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {/* DROPDOWNS — STACK ON MOBILE, INLINE ON DESKTOP */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:justify-end">

              {/* Filter */}
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

              {/* Sort */}
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
