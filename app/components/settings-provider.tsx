'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';

interface SettingsContextType {
  calendarView: 'calendar' | 'list';
  fiscalYear: string;
}

const SettingsContext = createContext<SettingsContextType>({
  calendarView: 'calendar',
  fiscalYear: new Date().getFullYear().toString(),
});

export function useSettings() {
  return useContext(SettingsContext);
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [calendarView, setCalendarView] = useState<'calendar' | 'list'>('calendar');
  const [fiscalYear, setFiscalYear] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    let isActive = true;

    const fetchSettings = async () => {
      if (!user) {
        // Clear settings when user logs out
        setCalendarView('calendar');
        setFiscalYear(new Date().getFullYear().toString());
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userDocRef);

        if (!isActive) return;

        if (userDoc.exists()) {
          const data = userDoc.data();

          if (data.settings?.calendarView) {
            const view = data.settings.calendarView;
            setCalendarView(view);
            localStorage.setItem("calendarView", view);
          }

          if (data.settings?.fiscalYear) {
            const year = data.settings.fiscalYear;
            setFiscalYear(year);
            localStorage.setItem("fiscalYear", year);
          }
        }
      } catch (error) {
        if (isActive) console.error("Error fetching user settings:", error);
      }
    };

    fetchSettings();

    return () => {
      isActive = false;
    };
  }, [user]);

  return (
    <SettingsContext.Provider value={{ calendarView, fiscalYear }}>
      {children}
    </SettingsContext.Provider>
  );
}
