'use client';

import { useEffect, useState } from 'react';
import { listenToSetLists } from '@/lib/setlists';
import type { SetList } from '@/lib/types';

export function useSetLists(churchId: string | null) {
  const [lists, setLists] = useState<SetList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLists([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = listenToSetLists(churchId, (data) => {
      setLists(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  return { lists, loading };
}
