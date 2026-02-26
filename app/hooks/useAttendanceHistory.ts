'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import type { Member } from '@/app/lib/types';

export interface AttendanceHistoryItem {
  dateString: string;
  records: Record<string, boolean>;
}

export function useAttendanceHistory(churchId: string | null) {
  const [data, setData] = useState<AttendanceHistoryItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!churchId) {
      setData([]);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Attendance
    const attendanceRef = collection(db, 'churches', churchId, 'attendance');
    const attendanceSnap = await getDocs(attendanceRef);

    const items: AttendanceHistoryItem[] = attendanceSnap.docs.map((d) => ({
      dateString: d.id,
      records: d.data().records || {},
    }));

    items.sort((a, b) => a.dateString.localeCompare(b.dateString));

    // Members
    const membersRef = collection(db, 'churches', churchId, 'members');
    const membersSnap = await getDocs(membersRef);
    const memberList: Member[] = membersSnap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Member, 'id'>),
    }));

    setData(items);
    setMembers(memberList);
    setLoading(false);
  }, [churchId]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, members, loading, refresh: load };
}
