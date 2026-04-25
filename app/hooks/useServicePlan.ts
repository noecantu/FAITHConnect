import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useServicePlan(churchId: string | undefined, planId: string | undefined) {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId || !planId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    async function fetchPlan() {
      const { data, error } = await supabase
        .from("service_plans")
        .select("*")
        .eq("id", planId)
        .eq("church_id", churchId)
        .single();

      if (!error) {
        setPlan(data);
      }
      setLoading(false);
    }

    fetchPlan();
  }, [churchId, planId]);

  return { plan, loading };
}
