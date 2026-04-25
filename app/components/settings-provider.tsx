'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { useAuth } from '../hooks/useAuth';

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
        const { data: userData } = await getSupabaseClient()
          .from("users")
          .select("settings")
          .eq("id", user.uid)
          .single();

        if (!isActive) return;

        if (userData) {
          const data = userData;

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
        const code = (error as { code?: string }).code;
        if (isActive && code !== 'permission-denied') {
          console.error('Error fetching user settings:', error);
        }
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
