import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useAttendance(
  churchId: string | null | undefined,
  members: any[],
  dateString: string,
  _editable: boolean
) {
  const [records, setRecords] = useState<Record<string, boolean>>({});
  const [visitors, setVisitors] = useState<{ id: string; name: string }[]>([]);
  const [membersSnapshot, setMembersSnapshot] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    if (!churchId || !dateString) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("church_id", churchId)
      .eq("date", dateString);

    if (error) {
      console.error("useAttendance fetch error:", error);
      setLoading(false);
      return;
    }

    const rows = data || [];
    const newRecords: Record<string, boolean> = {};
    const newVisitors: { id: string; name: string }[] = [];
    const snapshot: any[] = [];

    for (const row of rows) {
      if (row.member_id) {
        newRecords[row.member_id] = row.attended ?? false;
        snapshot.push({
          uid: row.member_id,
          id: row.member_id,
          firstName: (row.member_name ?? '').split(' ')[0] ?? '',
          lastName: (row.member_name ?? '').split(' ').slice(1).join(' ') ?? '',
          status: 'Active',
        });
      } else if (row.visitor_id) {
        newRecords[row.visitor_id] = row.attended ?? false;
        newVisitors.push({ id: row.visitor_id, name: row.visitor_name ?? '' });
      }
    }

    setRecords(newRecords);
    setVisitors(newVisitors);
    setMembersSnapshot(snapshot);
    setLoading(false);
  }, [churchId, dateString]);

  useEffect(() => {
    setLoading(true);
    fetchAttendance();
  }, [fetchAttendance]);

  const save = async () => {
    if (!churchId || !dateString) return;
    const supabase = getSupabaseClient();

    // Delete all rows for this date, then reinsert clean state
    await supabase
      .from("attendance")
      .delete()
      .eq("church_id", churchId)
      .eq("date", dateString);

    const rows: any[] = [];

    for (const member of members) {
      const id = member.uid ?? member.id;
      rows.push({
        church_id: churchId,
        date: dateString,
        member_id: id,
        member_name: `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim(),
        attended: records[id] ?? false,
      });
    }

    for (const visitor of visitors) {
      rows.push({
        church_id: churchId,
        date: dateString,
        visitor_id: visitor.id,
        visitor_name: visitor.name,
        attended: records[visitor.id] ?? true,
      });
    }

    if (rows.length > 0) {
      const { error } = await supabase.from("attendance").insert(rows);
      if (error) console.error("useAttendance save error:", error);
    }
  };

  const markAllPresent = (
    currentMembers: any[],
    currentVisitors: { id: string; name: string }[]
  ) => {
    setRecords((prev) => {
      const next = { ...prev };
      for (const m of currentMembers) next[m.uid ?? m.id] = true;
      for (const v of currentVisitors) next[v.id] = true;
      return next;
    });
  };

  const markAllAbsent = (
    currentMembers: any[],
    currentVisitors: { id: string; name: string }[]
  ) => {
    setRecords((prev) => {
      const next = { ...prev };
      for (const m of currentMembers) next[m.uid ?? m.id] = false;
      for (const v of currentVisitors) next[v.id] = false;
      return next;
    });
  };

  return {
    records,
    setRecords,
    visitors,
    setVisitors,
    save,
    loading,
    markAllPresent,
    markAllAbsent,
    membersSnapshot,
  };
}

