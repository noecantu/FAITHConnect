'use client';

import { useMemo, useState } from 'react';

export function useCalendarFilters<
  T extends { title: string; date: Date | string }
>(events: T[]) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'future' | 'past'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');

  const filtered = useMemo(() => {
    // ⭐ Normalize dates AND narrow type
    const normalized = events.map((e) => {
      const date = e.date instanceof Date ? e.date : new Date(e.date);

      // ⭐ Tell TS: this is still T, but with date: Date
      return { ...e, date } as T & { date: Date };
    });

    let result = normalized;

    // SEARCH
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((e) =>
        e.title.toLowerCase().includes(s)
      );
    }

    // FILTER
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'future') {
      result = result.filter(
        (e) => e.date.getTime() >= today.getTime()
      );
    } else if (filter === 'past') {
      result = result.filter(
        (e) => e.date.getTime() < today.getTime()
      );
    }

    // SORT
    result = [...result].sort((a, b) => {
      if (sort === 'newest') return b.date.getTime() - a.date.getTime();
      if (sort === 'oldest') return a.date.getTime() - b.date.getTime();
      return 0;
    });

    return result;
  }, [events, search, filter, sort]);

  return {
    search,
    setSearch,
    filter,
    setFilter,
    sort,
    setSort,
    filtered,
  };
}
