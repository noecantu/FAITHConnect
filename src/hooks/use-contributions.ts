'use client';

import { useEffect, useState } from 'react';
import { listenToContributions } from '@/lib/contributions';
import type { Contribution } from '@/lib/types';
import { useChurchId } from '@/hooks/useChurchId';

export function useContributions() {
  const churchId = useChurchId();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) return;

    const unsubscribe = listenToContributions(churchId, (data) => {
      setContributions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [churchId]);

  return { contributions, loading };
}
