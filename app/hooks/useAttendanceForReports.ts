'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { Member } from '@/app/lib/types';

export interface AttendanceRecord {
  id: string;
  date: string;
  memberId?: string;
  memberName?: string;
  visitorId?: string;
  visitorName?: string;
  attended: boolean;
}

export function useAttendanceForReports(churchId: string | null, members: Member[]) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!churchId) {
      setAttendance([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const colRef = collection(db, "churches", churchId, "attendance");
    const snap = await getDocs(colRef);

    const rows: AttendanceRecord[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const date = docSnap.id;

      const snapshotMembers = data.membersSnapshot || [];
      const visitorList = Array.isArray(data.visitors) ? data.visitors : [];

      // Build a quick lookup for visitor names
      const visitorNameMap: Record<string, string> = {};
      visitorList.forEach((v: any) => {
        visitorNameMap[v.id] = v.name;
      });

      console.log("RECORD IDS:", Object.keys(data.records || {}));
      console.log("VISITOR IDS:", (data.visitors || []).map((v: any) => v.id));

      // 1. Flatten members + visitors from records
      if (data.records) {
        Object.entries(data.records).forEach(([id, attended]) => {
          const isVisitor = id.startsWith("visitor-");

          if (isVisitor) {
            // Visitor row
            rows.push({
              id: `${date}-${id}`,
              date,
              attended: Boolean(attended),
              visitorId: id,
              visitorName: visitorNameMap[id],
            });
          } else {
            // Member row
            const member = snapshotMembers.find((m: any) => m.id === id);

            rows.push({
              id: `${date}-${id}`,
              date,
              attended: Boolean(attended),
              memberId: id,
              memberName: member
                ? `${member.firstName} ${member.lastName}`
                : undefined,
            });
          }
        });
      }

      // 2. Add visitors who were present but missing from records (edge case)
      visitorList.forEach((v: any) => {
        const alreadyIncluded = rows.some((r) => r.visitorId === v.id);
        if (!alreadyIncluded) {
          rows.push({
            id: `${date}-${v.id}`,
            date,
            attended: true,
            visitorId: v.id,
            visitorName: v.name,
          });
        }
      });
    });

    setAttendance(rows);
    setLoading(false);
  }, [churchId, members]);

  useEffect(() => {
    load();
  }, [load]);

  return { attendance, loading, refresh: load };
}
