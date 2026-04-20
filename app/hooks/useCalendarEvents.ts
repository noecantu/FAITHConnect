"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import type { Event } from "@/app/lib/types";

function normalizeDate(raw: any): Date {
  if (!raw) return new Date();
  if (raw.toDate) return raw.toDate();
  if (typeof raw === "string") {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  }
  if (raw instanceof Date) return raw;
  return new Date();
}

function normalizeEvent(raw: any, id: string): Event {
  const date = normalizeDate(raw.date);

  return {
    id,
    title: raw.title ?? "Untitled Event",
    description: raw.description ?? "",
    date,
    dateString: raw.dateString ?? date.toISOString().slice(0, 10),
    visibility: raw.visibility ?? (raw.isPublic ? "public" : "private"),
    groups: Array.isArray(raw.groups) ? raw.groups : [],
  };
}

export function useCalendarEvents(churchId: string | null) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const eventsRef = collection(db, "churches", churchId, "events");
    const eventsQuery = query(eventsRef, orderBy("date", "asc"));

    const unsub = onSnapshot(
      eventsQuery,
      (snap) => {
        const loaded = snap.docs.map((d) => normalizeEvent(d.data(), d.id));
        loaded.sort((a, b) => a.date.getTime() - b.date.getTime());
        setEvents(loaded);
        setLoading(false);
      },
      (error) => {
        const code = (error as { code?: string }).code;
        if (code !== "permission-denied") {
          console.error("useCalendarEvents snapshot error:", error);
        }
        setLoading(false);
      }
    );

    return () => unsub();
  }, [churchId]);

  return { events, loading };
}
