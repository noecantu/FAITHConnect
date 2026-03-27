'use client';

import { useCallback, useMemo, useState } from 'react';
import { startOfMonth, subMonths, addMonths, startOfToday } from 'date-fns';

export function useCalendarMonth() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const prevMonth = useCallback(() => {
    setMonth((m) => subMonths(m, 1));
  }, []);

  const nextMonth = useCallback(() => {
    setMonth((m) => addMonths(m, 1));
  }, []);

  const goToday = useCallback(() => {
    setMonth(startOfToday());
  }, []);

  return useMemo(
    () => ({
      month,
      setMonth,
      prevMonth,
      nextMonth,
      goToday,
    }),
    [month, prevMonth, nextMonth, goToday]
  );
}
