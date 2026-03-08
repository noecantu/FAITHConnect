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

  // Snapshot of members for history mode
  membersSnapshot: {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
  }[];

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
  editable: boolean = true
): UseAttendanceResult {
  const [records, setRecords] = useState<AttendanceRecords>({});
  const [visitors, setVisitors] = useState<AttendanceVisitor[]>([]);
  const [loading, setLoading] = useState(true);

  const [membersSnapshot, setMembersSnapshot] = useState<
    { id: string; firstName: string; lastName: string; status: string }[]
  >([]);

  const load = useCallback(async () => {
    if (!churchId) {
      setRecords({});
      setVisitors([]);
      setMembersSnapshot([]);
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
        membersSnapshot?: {
          id: string;
          firstName: string;
          lastName: string;
          status: string;
        }[];
      };

      setRecords(data.records || {});
      setVisitors(data.visitors || []);
      setMembersSnapshot(data.membersSnapshot || []);
    } else {
      setRecords({});
      setVisitors([]);
      setMembersSnapshot([]);
    }

    setLoading(false);
  }, [churchId, dateString]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id: string) => {
    if (!editable) return;

    setRecords((prev) => {
      const current = prev[id];
      const nextValue = current === undefined ? true : !current;
      return { ...prev, [id]: nextValue };
    });
  };

  const save = async () => {
    if (!churchId || !editable) return;

    const ref = doc(db, 'churches', churchId, 'attendance', dateString);

    await setDoc(ref, {
      records,
      visitors,
      membersSnapshot: members.map((m) => ({
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
    if (!editable) return;

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
    if (!editable) return;

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
    membersSnapshot,
    toggle,
    markAllPresent,
    markAllAbsent,
    save,
    loading,
  };
}
