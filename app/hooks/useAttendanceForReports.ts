import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { AttendanceRecord, Member } from "@/app/lib/types";

export type { AttendanceRecord } from "@/app/lib/types";

type AttendanceRow = {
  id: string;
  date: string;
  member_id: string | null;
  member_name: string | null;
  visitor_id: string | null;
  visitor_name: string | null;
  attended: boolean | null;
};

function rowToAttendanceRecord(row: AttendanceRow): AttendanceRecord {
  return {
    id: row.id,
    date: row.date,
    memberId: row.member_id ?? undefined,
    memberName: row.member_name ?? undefined,
    visitorId: row.visitor_id ?? undefined,
    visitorName: row.visitor_name ?? undefined,
    attended: row.attended ?? false,
  };
}

export function useAttendanceForReports(churchId: string | null | undefined, _members?: Member[]) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setAttendance([]);
      setLoading(false);
      return;
    }

    let active = true;

    const fetchData = async () => {
      setLoading(true);
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("attendance")
        .select("id, date, member_id, member_name, visitor_id, visitor_name, attended")
        .eq("church_id", churchId)
        .order("date", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("useAttendanceForReports fetch error:", error);
        setAttendance([]);
        setLoading(false);
        return;
      }

      const mapped = (data as AttendanceRow[] | null)?.map(rowToAttendanceRecord) ?? [];
      setAttendance(mapped);
      setLoading(false);
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [churchId]);

  return { attendance, loading };
}
