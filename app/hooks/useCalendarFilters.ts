'use client';

import { useMemo, useState } from 'react';
import type { Event as EventType } from '../lib/types';

export function useCalendarFilters(events: EventType[]) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'future' | 'past'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'title'>('newest');

  const filtered = useMemo(() => {
    let result = [...events];

    // SEARCH
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((e) => e.title.toLowerCase().includes(s));
    }

    // FILTER
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'future') {
      result = result.filter((e) => e.date.getTime() >= today.getTime());
    } else if (filter === 'past') {
      result = result.filter((e) => e.date.getTime() < today.getTime());
    }

    // SORT
    result.sort((a, b) => {
      if (sort === 'newest') return b.date.getTime() - a.date.getTime();
      if (sort === 'oldest') return a.date.getTime() - b.date.getTime();
      if (sort === 'title') return a.title.localeCompare(b.title);
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
