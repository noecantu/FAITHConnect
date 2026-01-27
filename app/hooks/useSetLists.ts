'use client';

import { useEffect, useState } from 'react';
import { listenToSetLists } from '../lib/setlists';
import type { SetList } from '../lib/types';

export function useSetLists(churchId: string | null) {
  const [lists, setLists] = useState<SetList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If churchId is still loading, stay in loading state
    if (!churchId) {
      return;
    }

    // Now we have a valid churchId — start loading
    setLoading(true);

    const unsubscribe = listenToSetLists(churchId, (data) => {
      setLists(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  return { lists, loading };
}
