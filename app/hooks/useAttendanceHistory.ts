'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

export interface AttendanceHistoryItem {
  dateString: string;
  records: Record<string, boolean>;
  membersSnapshot: {
    id: string;
    firstName: string;
    lastName: string;
    status: string;
  }[];
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

    const attendanceRef = collection(db, 'churches', churchId, 'attendance');
    const attendanceSnap = await getDocs(attendanceRef);

    const items: AttendanceHistoryItem[] = attendanceSnap.docs.map((d) => {
      const data = d.data();

      return {
        dateString: d.id,
        records: data.records || {},
        membersSnapshot: data.membersSnapshot || [],
      };
    });

    items.sort((a, b) => a.dateString.localeCompare(b.dateString));

    setData(items);
    setLoading(false);
  }, [churchId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, refresh: load };
}
