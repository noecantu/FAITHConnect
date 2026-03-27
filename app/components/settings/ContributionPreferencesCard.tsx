"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";

export function ContributionPreferencesCard({
  userId,
  churchId,
  onDirtyChange,
  registerSave,
}: {
  userId: string;
  churchId: string;
  onDirtyChange?: (dirty: boolean) => void;
  registerSave?: (fn: () => Promise<void>) => void;
}) {
  if (!userId) return null;

  const [loading, setLoading] = useState(true);

  const [breakdown, setBreakdown] = useState<"year" | "month" | "week">("year");
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [week, setWeek] = useState<number | null>(null);

  const [initial, setInitial] = useState<any>(null);

  const [years, setYears] = useState<number[]>([]);
  const [monthMap, setMonthMap] = useState<Map<number, number[]>>(new Map());
  const [weekMap, setWeekMap] = useState<Map<number, number[]>>(new Map());

  const [months, setMonths] = useState<number[]>([]);
  const [weeks, setWeeks] = useState<number[]>([]);

  useEffect(() => {
    async function load() {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);
      const settings = userSnap.data()?.settings?.contributionsHistory;

      const initialState = {
        breakdown: settings?.breakdown ?? "year",
        year: settings?.year ?? null,
        month: settings?.month ?? null,
        week: settings?.week ?? null,
      };

      setBreakdown(initialState.breakdown);
      setYear(initialState.year);
      setMonth(initialState.month);
      setWeek(initialState.week);
      setInitial(initialState);

      const contribRef = collection(db, "churches", churchId, "contributions");
      const q = query(contribRef, where("userId", "==", userId));
      const contribSnap = await getDocs(q);

      const yearSet = new Set<number>();
      const mMap = new Map<number, Set<number>>();
      const wMap = new Map<number, Set<number>>();

      contribSnap.forEach((doc) => {
        const data = doc.data();
        const d = data.date.toDate();
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const w = getWeekNumber(d);

        yearSet.add(y);

        if (!mMap.has(y)) mMap.set(y, new Set());
        mMap.get(y)!.add(m);

        if (!wMap.has(y)) wMap.set(y, new Set());
        wMap.get(y)!.add(w);
      });

      const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
      setYears(sortedYears);

      const finalMonthMap = new Map<number, number[]>();
      const finalWeekMap = new Map<number, number[]>();

      sortedYears.forEach((y) => {
        finalMonthMap.set(y, Array.from(mMap.get(y) ?? []).sort((a, b) => a - b));
        finalWeekMap.set(y, Array.from(wMap.get(y) ?? []).sort((a, b) => a - b));
      });

      setMonthMap(finalMonthMap);
      setWeekMap(finalWeekMap);

      setLoading(false);
    }

    load();
  }, [userId, churchId]);

  useEffect(() => {
    if (!year) return;

    const m = monthMap.get(year) ?? [];
    const w = weekMap.get(year) ?? [];

    setMonths(m);
    setWeeks(w);

    if (breakdown === "month" && month && !m.includes(month)) {
      setMonth(m[0] ?? null);
    }

    if (breakdown === "week" && week && !w.includes(week)) {
      setWeek(w[0] ?? null);
    }
  }, [year, breakdown, monthMap, weekMap]);

  function getWeekNumber(date: Date) {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - firstDay.getTime()) / 86400000);
    return Math.ceil((days + firstDay.getDay() + 1) / 7);
  }

  // Dirty tracking
  useEffect(() => {
    if (!initial || !onDirtyChange) return;

    const dirty =
      breakdown !== initial.breakdown ||
      year !== initial.year ||
      month !== initial.month ||
      week !== initial.week;

    onDirtyChange(dirty);
  }, [breakdown, year, month, week, initial, onDirtyChange]);

  // Save function for FAB
  async function save() {
    const userRef = doc(db, "users", userId);

    await updateDoc(userRef, {
      "settings.contributionsHistory": {
        breakdown,
        year,
        month: breakdown === "month" ? month : null,
        week: breakdown === "week" ? week : null,
      },
    });

    setInitial({ breakdown, year, month, week });
  }

  // Register save function
  useEffect(() => {
    if (registerSave) registerSave(save);
  }, [registerSave, save]);

  if (loading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contribution Preferences</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Breakdown</Label>
          <Select value={breakdown} onValueChange={(v) => setBreakdown(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="year">Year</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Year</Label>
          <Select value={year?.toString() ?? ""} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {breakdown === "month" && (
          <div className="space-y-1">
            <Label>Month</Label>
            <Select value={month?.toString() ?? ""} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {breakdown === "week" && (
          <div className="space-y-1">
            <Label>Week</Label>
            <Select value={week?.toString() ?? ""} onValueChange={(v) => setWeek(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weeks.map((w) => (
                  <SelectItem key={w} value={w.toString()}>
                    Week {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
