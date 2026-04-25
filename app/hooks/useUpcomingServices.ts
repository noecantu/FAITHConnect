import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useUpcomingServices(churchId: string | undefined) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    async function fetchServices() {
      const { data, error } = await supabase
        .from("service_plans")
        .select("*")
        .eq("church_id", churchId)
        .gte("date_string", today)
        .order("date_string", { ascending: true });

      if (!error) {
        setServices(data || []);
      }
      setLoading(false);
    }

    fetchServices();
  }, [churchId]);

  return { services, loading };
}
