import { useEffect, useState, useCallback } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from '@/app/lib/firebase/client';
import { AppUser } from "@/app/lib/types";

export function useAttendanceHistorySettings(user: AppUser | null | undefined) {
  const [breakdown, setBreakdown] = useState<"year" | "month" | "week">("year");
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [week, setWeek] = useState<number | null>(null);

  // Load settings on mount
  useEffect(() => {
    if (!user?.uid) return;

    const load = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      const s = snap.data()?.settings?.attendanceHistory;

      if (!s) return;

      if (s.breakdown) setBreakdown(s.breakdown);
      if (s.year !== undefined) setYear(s.year);
      if (s.month !== undefined) setMonth(s.month);
      if (s.week !== undefined) setWeek(s.week);
    };

    load();
  }, [user?.uid]);

  // Persist helper
  const persist = useCallback(
    async (field: string, value: any) => {
      if (!user?.uid) return;

      await updateDoc(doc(db, "users", user.uid), {
        [`settings.attendanceHistory.${field}`]: value,
        updatedAt: serverTimestamp(),
      });
    },
    [user?.uid]
  );

  // Persisted setters
  const setBreakdownPersisted = useCallback(
    (v: "year" | "month" | "week") => {
      setBreakdown(v);
      persist("breakdown", v);
    },
    [persist]
  );

  const setYearPersisted = useCallback(
    (v: number | null) => {
      setYear(v);
      persist("year", v);
    },
    [persist]
  );

  const setMonthPersisted = useCallback(
    (v: number | null) => {
      setMonth(v);
      persist("month", v);
    },
    [persist]
  );

  const setWeekPersisted = useCallback(
    (v: number | null) => {
      setWeek(v);
      persist("week", v);
    },
    [persist]
  );

  return {
    breakdown,
    year,
    month,
    week,

    setBreakdownPersisted,
    setYearPersisted,
    setMonthPersisted,
    setWeekPersisted,
  };
}
