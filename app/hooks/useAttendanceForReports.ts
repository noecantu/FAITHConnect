import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useAttendanceForReports(churchId: string | undefined, startDate: string, endDate: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    async function fetchData() {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("church_id", churchId)
        .gte("date_string", startDate)
        .lte("date_string", endDate);

      if (!error) {
        setData(data || []);
      }
      setLoading(false);
    }

    fetchData();
  }, [churchId, startDate, endDate]);

  return { data, loading };
}
