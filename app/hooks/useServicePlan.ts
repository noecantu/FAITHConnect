import { useState, useEffect } from 'react';
import { getServicePlanById } from "@/app/lib/servicePlans";
import type { ServicePlan } from "@/app/lib/types";

export function useServicePlan(churchId: string | undefined, planId: string | undefined) {
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId || !planId) {
      setLoading(false);
      return;
    }

    async function fetchPlan() {
      const data = await getServicePlanById(churchId!, planId!);
      setPlan(data);
      setLoading(false);
    }

    fetchPlan();
  }, [churchId, planId]);

  return { plan, loading };
}
