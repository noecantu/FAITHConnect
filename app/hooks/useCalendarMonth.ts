'use client';

import { useState } from 'react';
import { startOfMonth, subMonths, addMonths, startOfToday } from 'date-fns';

export function useCalendarMonth() {
  const [month, setMonth] = useState(startOfMonth(new Date()));

  return {
    month,
    setMonth,
    prevMonth: () => setMonth((m) => subMonths(m, 1)),
    nextMonth: () => setMonth((m) => addMonths(m, 1)),
    goToday: () => setMonth(startOfToday()),
  };
}
