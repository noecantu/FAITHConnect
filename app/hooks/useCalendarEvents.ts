import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebase/client";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import type { Event } from "../lib/types";

export function useCalendarEvents(
churchId: string | null, p0: string | null, isAdmin: boolean, managerGroup: string | null) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!churchId) {
      setEvents([]);
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

      // VISIBILITY FILTERING
      const filtered = all.filter((event) => {
        // Admin sees everything
        if (isAdmin) return true;

        // Public event
        if (event.isPublic) return true;

        // Manager sees their group's events
        if (managerGroup && event.groups?.includes(managerGroup)) {
          return true;
        }

        // Members see nothing else
        return false;
      });

      setEvents(filtered);
    });

    return () => unsub();
  }, [churchId]);

  return { events };
}
