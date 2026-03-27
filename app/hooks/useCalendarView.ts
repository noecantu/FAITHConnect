'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export function useCalendarView(defaultView: 'calendar' | 'list') {
  const [view, setView] = useState<'calendar' | 'list'>(defaultView);

  // Load once on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('calendarView');
      if (saved === 'calendar' || saved === 'list') {
        setView(saved);
      }
    } catch {}
  }, []);

  // Persist on change
  const updateView = useCallback((v: 'calendar' | 'list') => {
    setView(v);
    try {
      localStorage.setItem('calendarView', v);
    } catch {}
  }, []);

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'calendarView') {
        if (e.newValue === 'calendar' || e.newValue === 'list') {
          setView(e.newValue);
        }
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return useMemo(() => ({ view, setView: updateView }), [view, updateView]);
}
