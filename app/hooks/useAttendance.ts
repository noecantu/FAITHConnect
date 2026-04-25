import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useAttendance(churchId: string | undefined, dateString: string | undefined) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!churchId || !dateString) {
      setLoading(false);
      return;
    }

    async function fetchAttendance() {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("church_id", churchId)
        .eq("date_string", dateString);

      if (!error) {
        setAttendance(data || []);
      }
      setLoading(false);
    }

    fetchAttendance();
  }, [churchId, dateString]);

  const saveAttendance = async (records: any[]) => {
    if (!churchId || !dateString) return;
    
    const { error } = await supabase
      .from("attendance")
      .upsert(records.map(r => ({ ...r, church_id: churchId, date_string: dateString })));
    
    return { error };
  };

  return { attendance, loading, saveAttendance };
}
