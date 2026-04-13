'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase/client';
import { useAuth } from './useAuth';
import type { AppUser } from '../lib/types';
export function useSettings() {
  const { user } = useAuth(); // must contain user.uid
  const [settings, setSettings] = useState<AppUser['settings'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      // If user logs out, clear settings immediately
      setSettings(null);
      setLoading(false);
      return;
    }

    const ref = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setSettings(null);
        setLoading(false);
        return;
      }

      const data = snap.data() as AppUser;
      setSettings(data.settings ?? null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return {
    settings,
    loading,

    // Safe defaults
    calendarView: settings?.calendarView ?? 'calendar',
    cardView: settings?.cardView ?? 'show',
    fiscalYear: settings?.fiscalYear ?? 'all',
  };
}
