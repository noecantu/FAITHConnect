import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export interface AttendanceHistoryItem {
  dateString: string;
  membersSnapshot: { id: string; status: string; firstName?: string; lastName?: string }[];
  records: Record<string, boolean>;
}

export function useAttendanceHistory(churchId: string | undefined) {
  const [data, setData] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClient();
    const { data: rows, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("church_id", churchId)
      .order("date", { ascending: false });

    if (error) {
      console.error("useAttendanceHistory fetch error:", error);
      setLoading(false);
      return;
    }

    // Group individual rows by date into AttendanceHistoryItem shape
    const byDate = new Map<string, AttendanceHistoryItem>();
    for (const row of rows ?? []) {
      const dateStr: string = row.date ?? '';
      if (!byDate.has(dateStr)) {
        byDate.set(dateStr, { dateString: dateStr, membersSnapshot: [], records: {} });
      }
      const item = byDate.get(dateStr)!;

      if (row.member_id) {
        item.membersSnapshot.push({
          id: row.member_id,
          status: 'Active',
          firstName: (row.member_name ?? '').split(' ')[0] ?? '',
          lastName: (row.member_name ?? '').split(' ').slice(1).join(' ') ?? '',
        });
        item.records[row.member_id] = row.attended ?? false;
      } else if (row.visitor_id) {
        item.records[row.visitor_id] = row.attended ?? false;
      }
    }

    setData(Array.from(byDate.values()));
    setLoading(false);
  }, [churchId]);

  useEffect(() => { fetch(); }, [fetch]);

  const refresh = () => fetch();

  return { data, loading, refresh };
}
