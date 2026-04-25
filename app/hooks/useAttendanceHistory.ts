import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useAttendanceHistory(churchId: string | undefined) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    async function fetchHistory() {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("church_id", churchId)
        .order("date_string", { ascending: false });

      if (!error) {
        setHistory(data || []);
      }
      setLoading(false);
    }

    fetchHistory();
  }, [churchId]);

  return { history, loading };
}
