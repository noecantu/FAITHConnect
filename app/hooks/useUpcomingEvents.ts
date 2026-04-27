import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useUpcomingEvents(churchId: string | null | undefined) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("church_id", churchId)
        .gte("date_string", today)
        .order("date_string", { ascending: true });

      if (!error) {
        setEvents(data || []);
      }
      setLoading(false);
    }

    fetchEvents();
  }, [churchId]);

  return { events, loading };
}
