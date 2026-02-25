'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ServicePlan } from '@/app/lib/types';
import { getServicePlans } from '@/app/lib/servicePlans';

export function useServicePlans(churchId: string | null | undefined) {  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadPlans = useCallback(async () => {
    if (!churchId) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getServicePlans(churchId);
      setPlans(data);
    } catch (err) {
      console.error('Failed to load service plans:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [churchId]);

  useEffect(() => {
    if (churchId) {
      loadPlans();
    }
  }, [churchId, loadPlans]);

  return {
    plans,
    loading,
    error,
    reload: loadPlans,
  };
}
