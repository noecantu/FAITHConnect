"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";

export function CalendarPreferencesCard({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "list">("calendar");

  useEffect(() => {
    if (!userId) return;

    async function load() {
      const ref = doc(db, "users", userId);
      const snap = await getDoc(ref);

      const saved = snap.data()?.settings?.calendarView;
      if (saved === "calendar" || saved === "list") {
        setView(saved);
      }

      setLoading(false);
    }

    load();
  }, [userId]);

  async function save() {
    const ref = doc(db, "users", userId);
    await updateDoc(ref, {
      "settings.calendarView": view,
    });
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Calendar View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar View</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Default View</Label>
          <Select value={view} onValueChange={(v) => setView(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calendar">Calendar</SelectItem>
              <SelectItem value="list">List</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={save}>Save</Button>
      </CardContent>
    </Card>
  );
}
