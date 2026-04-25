import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useCalendarEvents(churchId: string | undefined) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("church_id", churchId);

      if (!error) {
        setEvents(data || []);
      }
      setLoading(false);
    }

    fetchEvents();
  }, [churchId]);

  return { events, loading };
}
