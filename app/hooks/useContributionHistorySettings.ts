import { useEffect, useState, useCallback } from "react";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { User } from "@/app/lib/types";

export function useContributionHistorySettings(user: User | null | undefined) {
  const [breakdown, setBreakdown] = useState<"year" | "month" | "week">("year");
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [week, setWeek] = useState<number | null>(null);

  // Load settings on mount
  useEffect(() => {
    if (!user?.id) return;

    const load = async () => {
      const ref = doc(db, "users", user.id);
      const snap = await getDoc(ref);
      const s = snap.data()?.settings?.contributionsHistory;

      if (!s) return;

      if (s.breakdown) setBreakdown(s.breakdown);
      if (s.year !== undefined) setYear(s.year);
      if (s.month !== undefined) setMonth(s.month);
      if (s.week !== undefined) setWeek(s.week);
    };

    load();
  }, [user?.id]);

  // Persist helper
  const persist = useCallback(
    async (field: string, value: any) => {
      if (!user?.id) return;

      await updateDoc(doc(db, "users", user.id), {
        [`settings.contributionsHistory.${field}`]: value,
        updatedAt: serverTimestamp(),
      });
    },
    [user?.id]
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
