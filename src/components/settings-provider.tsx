'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase';

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
    // 1. Load initial values from localStorage (fastest)
    const savedView = localStorage.getItem("calendarView");
    if (savedView === 'calendar' || savedView === 'list') {
      setCalendarView(savedView);
    }
    const savedYear = localStorage.getItem("fiscalYear");
    if (savedYear) {
      setFiscalYear(savedYear);
    }

    // 2. If user is logged in, fetch from Firestore and update
    const fetchSettings = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
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
        console.error("Error fetching user settings:", error);
      }
    };

    fetchSettings();
  }, [user]);

  return (
    <SettingsContext.Provider value={{ calendarView, fiscalYear }}>
      {children}
    </SettingsContext.Provider>
  );
}
