'use client';

import { useEffect, useState } from 'react';
import { listenToContributions } from '../lib/contributions';
import type { Contribution } from '../lib/types';
import { useChurchId } from './useChurchId';
import { useAuth } from './useAuth';

export function useContributions() {
  const { churchId } = useChurchId();
  const { user } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId || !user?.id) {
      setContributions([]);
      setLoading(false);
      return;
    }

    const unsubscribe = listenToContributions(
      churchId,
      (data) => {
        setContributions(data);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [churchId, user?.id]);

  return { contributions, loading };
}

