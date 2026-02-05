'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import type { User } from '../lib/types';
export function useSettings() {
  const { user } = useAuth(); // must contain user.id
  const [settings, setSettings] = useState<User['settings'] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      // If user logs out, clear settings immediately
      setSettings(null);
      setLoading(false);
      return;
    }

    const ref = doc(db, 'users', user.id);

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setSettings(null);
        setLoading(false);
        return;
      }

      const data = snap.data() as User;
      setSettings(data.settings ?? null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  return {
    settings,
    loading,

    // Safe defaults
    calendarView: settings?.calendarView ?? 'calendar',
    cardView: settings?.cardView ?? 'show',
    fiscalYear: settings?.fiscalYear ?? 'all',
  };
}
