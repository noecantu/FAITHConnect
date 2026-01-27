'use client';

import { useEffect, useState } from 'react';
import { listenToSetLists } from '../lib/setlists';
import type { SetList } from '../lib/types';
import dayjs from 'dayjs';

export function useRecentSetLists(churchId: string | null) {
  const [lists, setLists] = useState<SetList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLists([]);
      setLoading(false);
      return;
    }

    const cutoff = dayjs().subtract(4, 'week').toDate();

    const unsubscribe = listenToSetLists(churchId, (all) => {
      const recent = all.filter((l) => l.date >= cutoff);
      setLists(recent);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  return { lists, loading };
}
