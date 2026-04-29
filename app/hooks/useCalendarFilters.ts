'use client';

import { useEffect, useMemo, useState } from 'react';

const LIST_FILTERS_STORAGE_KEY = 'calendarListFilters';

type ListFilterValue = 'all' | 'future' | 'past';
type ListSortValue = 'newest' | 'oldest' | 'title';

function readSavedListFilters(): { filter: ListFilterValue; sort: ListSortValue } | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LIST_FILTERS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { filter?: unknown; sort?: unknown };
    const filter =
      parsed.filter === 'future' || parsed.filter === 'past' || parsed.filter === 'all'
        ? parsed.filter
        : 'all';
    const sort =
      parsed.sort === 'oldest' || parsed.sort === 'title' || parsed.sort === 'newest'
        ? parsed.sort
        : 'newest';

    return { filter, sort };
  } catch {
    return null;
  }
}

export function useCalendarFilters<
  T extends { title: string; date: Date | string }
>(events: T[]) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ListFilterValue>(
    () => readSavedListFilters()?.filter ?? 'all'
  );
  const [sort, setSort] = useState<ListSortValue>(
    () => readSavedListFilters()?.sort ?? 'newest'
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LIST_FILTERS_STORAGE_KEY,
        JSON.stringify({ filter, sort })
      );
    } catch {
      // Ignore persistence failures (private mode/storage disabled).
    }
  }, [filter, sort]);

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
