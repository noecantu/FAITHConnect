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
    if (!user?.uid) return;

    const ref = doc(db, 'users', user.uid);

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
