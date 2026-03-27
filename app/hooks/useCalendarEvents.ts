'use client';

import { useEffect, useMemo, useState } from "react";
import { db } from "@/app/lib/firebase/client";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import type { Event } from "../lib/types";

export function useCalendarEvents(
  churchId: string | null,
  userId: string | null,
  isAdmin: boolean,
  managerGroup: string | null,
  memberGroups: string[]
) {
  // Store only raw Firestore events.
  // Filtering happens in a memo to avoid identity churn.
  const [rawEvents, setRawEvents] = useState<Event[]>([]);

  // ------------------------------
  // FIRESTORE SUBSCRIPTION
  // ------------------------------
  useEffect(() => {
    if (!churchId) {
      setRawEvents([]);
      return;
    }

    const ref = collection(db, "churches", churchId, "events");
    const q = query(ref, orderBy("date", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => {
        const raw = d.data() as Omit<Event, "id" | "date"> & { date: any };

        return {
          id: d.id,
          ...raw,
          date: raw.date?.toDate ? raw.date.toDate() : new Date(raw.date),
        };
      });

      setRawEvents(all);
    });

    return () => unsub();
  }, [churchId]);

  // ------------------------------
  // PRIVILEGE-BASED FILTERING
  // ------------------------------
  const events = useMemo(() => {
    // Admin sees everything
    if (isAdmin) return rawEvents;

    return rawEvents.filter((event) => {
      // Public event
      if (event.isPublic) return true;

      // Manager sees their group's events
      if (managerGroup && event.groups?.includes(managerGroup)) {
        return true;
      }

      // Members see events for any group they belong to
      if (memberGroups?.some((g) => event.groups?.includes(g))) {
        return true;
      }

      return false;
    });
  }, [rawEvents, isAdmin, managerGroup, memberGroups]);

  return { events };
}
