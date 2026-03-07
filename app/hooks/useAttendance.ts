'use client';

import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

export type AttendanceRecords = Record<string, boolean>;

export type AttendanceVisitor = {
  id: string;
  name: string;
};

interface UseAttendanceResult {
  records: AttendanceRecords;
  setRecords: React.Dispatch<React.SetStateAction<AttendanceRecords>>;
  visitors: AttendanceVisitor[];
  setVisitors: React.Dispatch<React.SetStateAction<AttendanceVisitor[]>>;
  toggle: (id: string) => void;
  markAllPresent: (
    members: { id: string; status: string }[],
    visitors: AttendanceVisitor[]
  ) => void;
  markAllAbsent: (
    members: { id: string; status: string }[],
    visitors: AttendanceVisitor[]
  ) => void;
  save: () => Promise<void>;
  loading: boolean;
}

export function useAttendance(
  churchId: string | null,
  members: { id: string; firstName: string; lastName: string; status: string }[],
  dateString: string,
): UseAttendanceResult {
  const [records, setRecords] = useState<AttendanceRecords>({});
  const [visitors, setVisitors] = useState<AttendanceVisitor[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!churchId) {
      setRecords({});
      setVisitors([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ref = doc(db, 'churches', churchId, 'attendance', dateString);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data() as {
        records?: AttendanceRecords;
        visitors?: AttendanceVisitor[];
        membersSnapshot?: any[];
      };

      setRecords(data.records || {});
      setVisitors(data.visitors || []);
    } else {
      setRecords({});
      setVisitors([]);
    }

    setLoading(false);
  }, [churchId, dateString]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id: string) => {
    setRecords((prev) => {
      const current = prev[id];
      const nextValue = current === undefined ? true : !current;
      return { ...prev, [id]: nextValue };
    });
  };

  const save = async () => {
    if (!churchId) return;

    const ref = doc(db, 'churches', churchId, 'attendance', dateString);

    await setDoc(ref, {
      records,
      visitors,
      membersSnapshot: members.map(m => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        status: m.status,
      })),
    });
  };

  const markAllPresent = (
    members: { id: string; status: string }[],
    visitors: AttendanceVisitor[]
  ) => {
    const updated: AttendanceRecords = {};

    for (const m of members) {
      if (m.status !== 'Archived') {
        updated[m.id] = true;
      }
    }

    for (const v of visitors) {
      updated[v.id] = true;
    }

    setRecords(updated);
  };

  const markAllAbsent = (
    members: { id: string; status: string }[],
    visitors: AttendanceVisitor[]
  ) => {
    const updated: AttendanceRecords = {};

    for (const m of members) {
      if (m.status !== 'Archived') {
        updated[m.id] = false;
      }
    }

    for (const v of visitors) {
      updated[v.id] = false;
    }

    setRecords(updated);
  };

  return {
    records,
    setRecords,
    visitors,
    setVisitors,
    toggle,
    markAllPresent,
    markAllAbsent,
    save,
    loading,
  };
}
