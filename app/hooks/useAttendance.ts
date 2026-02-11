'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { useMembers } from '@/app/hooks/useMembers';

export function useAttendance(churchId: string | null, dateString: string) {
  const { members, loading: membersLoading } = useMembers(churchId ?? '');
  const [records, setRecords] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId || !dateString) return;

    const load = async () => {
      const ref = doc(db, 'churches', churchId, 'attendance', dateString);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setRecords(snap.data().records || {});
      } else {
        setRecords({});
      }

      setLoading(false);
    };

    load();
  }, [churchId, dateString]);

  const toggle = async (memberId: string) => {
    if (!churchId) return;

    const newValue = !records[memberId];
    const newRecords = { ...records, [memberId]: newValue };
    setRecords(newRecords);

    const ref = doc(db, 'churches', churchId, 'attendance', dateString);
    await setDoc(ref, { dateString, records: newRecords }, { merge: true });
  };

  return {
    members,
    records,
    toggle,
    loading: loading || membersLoading,
  };
}