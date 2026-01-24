'use client';

import { useEffect, useState } from 'react';
import { getServicePlanById } from '@/lib/servicePlans';
import { useChurchId } from '@/hooks/useChurchId';
import type { ServicePlan } from '@/lib/types';

export function useServicePlan(id?: string) {
    const churchId = useChurchId();
    const [plan, setPlan] = useState<ServicePlan | null>(null);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      if (!churchId || !id) return;
  
      const churchIdStrict = churchId;
      const idStrict = id;
  
      let active = true;
  
      async function load() {
        const data = await getServicePlanById(churchIdStrict, idStrict);
        if (active) {
          setPlan(data);
          setLoading(false);
        }
      }
  
      load();
  
      return () => {
        active = false;
      };
    }, [churchId, id]);
  
    return { plan, loading };
  }
  
