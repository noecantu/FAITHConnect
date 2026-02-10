'use client';

import { useEffect, useState } from 'react';

export function useCalendarView(defaultView: 'calendar' | 'list') {
  const [view, setView] = useState<'calendar' | 'list'>(defaultView);

  useEffect(() => {
    const saved = localStorage.getItem('calendarView');
    if (saved === 'calendar' || saved === 'list') {
      setView(saved);
    }
  }, []);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'calendarView' && (e.newValue === 'calendar' || e.newValue === 'list')) {
        setView(e.newValue);
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return { view, setView };
}
