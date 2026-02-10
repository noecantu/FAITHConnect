'use client';

import { useEffect, useRef, useState } from 'react';

export function useCalendarView(defaultView: 'calendar' | 'list') {
  const [view, setView] = useState<'calendar' | 'list'>(defaultView);

  // Keep a ref to the latest view to avoid dependency loops
  const viewRef = useRef(view);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('calendarView');
    if (saved === 'calendar' || saved === 'list') {
      if (saved !== viewRef.current) setView(saved);
    }
  }, []);

  // Sync changes to localStorage
  useEffect(() => {
    localStorage.setItem('calendarView', view);
  }, [view]);

  // Sync changes across OTHER tabs only
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (
        e.key === 'calendarView' &&
        (e.newValue === 'calendar' || e.newValue === 'list') &&
        e.newValue !== viewRef.current
      ) {
        setView(e.newValue);
      }
    };

    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return { view, setView };
}
