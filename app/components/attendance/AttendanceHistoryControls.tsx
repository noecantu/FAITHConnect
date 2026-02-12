'use client';

import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/app/components/ui/select';

interface AttendanceFilters {
  search: string;
  setSearch: (v: string) => void;
  filter: 'all' | 'future' | 'past';
  setFilter: (v: 'all' | 'future' | 'past') => void;
  sort: 'newest' | 'oldest';
  setSort: (v: 'newest' | 'oldest') => void;
}

interface AttendanceHistoryControlsProps {
  filters: AttendanceFilters;
}

export function AttendanceHistoryControls({ filters }: AttendanceHistoryControlsProps) {
  return (
    <div className="space-y-4">

      <div className="flex flex-col gap-4 w-full">

        {/* Row: Search + Dropdowns */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-4 w-full">

          {/* SEARCH */}
          <div className="w-full md:flex-1">
            <Input
              placeholder="Search attendance…"
              value={filters.search}
              onChange={(e) => filters.setSearch(e.target.value)}
              className="w-full"
            />
          </div>

          {/* DROPDOWNS */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 md:justify-end">

            {/* Filter */}
            <Select
              value={filters.filter}
              onValueChange={(v: AttendanceFilters["filter"]) => filters.setFilter(v)}
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
              onValueChange={(v: AttendanceFilters["sort"]) => filters.setSort(v)}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>

          </div>
        </div>
      </div>
    </div>
  );
}
