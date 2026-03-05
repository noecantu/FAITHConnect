'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

export interface AttendanceRecord {
  id: string;
  date: string;
  memberId?: string;
  visitorId?: string;
  visitorName?: string;
  attended: boolean;
}

export function useAttendanceForReports(churchId: string | null) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!churchId) {
      setAttendance([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const colRef = collection(db, 'churches', churchId, 'attendance');
    const snap = await getDocs(colRef);

    const rows: AttendanceRecord[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const date = docSnap.id;

      // Flatten records
      if (data.records) {
        Object.entries(data.records).forEach(([id, attended]) => {
          rows.push({
            id: `${date}-${id}`,
            date,
            attended: Boolean(attended),
            memberId: id.startsWith('visitor-') ? undefined : id,
            visitorId: id.startsWith('visitor-') ? id : undefined,
          });
        });
      }

      // Add visitor names
      if (Array.isArray(data.visitors)) {
        data.visitors.forEach((v: any) => {
          rows.push({
            id: `${date}-${v.id}`,
            date,
            attended: true,
            visitorId: v.id,
            visitorName: v.name,
          });
        });
      }
    });

    setAttendance(rows);
    setLoading(false);
  }, [churchId]);

  useEffect(() => {
    load();
  }, [load]);

  return { attendance, loading, refresh: load };
}
