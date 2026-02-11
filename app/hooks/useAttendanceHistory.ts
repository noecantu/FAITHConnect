'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

export interface AttendanceHistoryItem {
  dateString: string;
  records: Record<string, boolean>;
}

export function useAttendanceHistory(churchId: string | null) {
  const [data, setData] = useState<AttendanceHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!churchId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const ref = collection(db, 'churches', churchId, 'attendance');
    const snap = await getDocs(ref);

    const items: AttendanceHistoryItem[] = snap.docs.map((d) => ({
      dateString: d.id,
      records: d.data().records || {},
    }));

    items.sort((a, b) => a.dateString.localeCompare(b.dateString));

    setData(items);
    setLoading(false);
  }, [churchId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, refresh: load };
}
