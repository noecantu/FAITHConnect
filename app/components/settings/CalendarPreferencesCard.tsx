"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";

export function CalendarPreferencesCard({
  userId,
  onDirtyChange,
  registerSave,
}: {
  userId: string;
  onDirtyChange?: (dirty: boolean) => void;
  registerSave?: (fn: () => Promise<void>) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [initialView, setInitialView] = useState<"calendar" | "list">("calendar");

  // Load initial value
  useEffect(() => {
    if (!userId) return;

    async function load() {
      const ref = doc(db, "users", userId);
      const snap = await getDoc(ref);

      const saved = snap.data()?.settings?.calendarView;
      const v = saved === "list" ? "list" : "calendar";

      setView(v);
      setInitialView(v);
      setLoading(false);
    }

    load();
  }, [userId]);

  // Stable save function
  const save = useCallback(async () => {
    const ref = doc(db, "users", userId);
    await updateDoc(ref, {
      "settings.calendarView": view,
    });
    setInitialView(view);
  }, [userId, view]);

  // Register save function ONCE
  useEffect(() => {
    if (registerSave) {
      registerSave(save);
    }
  }, [registerSave, save]);

  // Dirty tracking
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(view !== initialView);
    }
  }, [view, initialView, onDirtyChange]);

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
      </CardContent>
    </Card>
  );
}
