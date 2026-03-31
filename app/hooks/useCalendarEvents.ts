import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import type { Event, UserProfile, ServicePlanFirestore } from "@/app/lib/types";
import { canUserSeeEvent } from "@/app/lib/canUserSeeEvent";

export function useCalendarEvents(
  churchId: string | null,
  user: UserProfile | null
) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!churchId || !user) {
      setEvents([]);
      return;
    }

    // Local caches for merging
    let latestEvents: Event[] = [];
    let latestServices: Event[] = [];

    function updateCombined() {
      const combined = [...latestEvents, ...latestServices];

      const visible = combined.filter((item) =>
        canUserSeeEvent(user!, {
          visibility: item.isPublic ? "public" : "private",
          groups: item.groups ?? [],
        })
      );

      visible.sort((a, b) => a.date.getTime() - b.date.getTime());

      setEvents(visible);
    }

    // -----------------------------
    // Listen to EVENTS
    // -----------------------------
    const eventsRef = collection(db, "churches", churchId, "events");
    const eventsQuery = query(eventsRef, orderBy("date", "asc"));

    const unsubEvents = onSnapshot(eventsQuery, (snap) => {
      latestEvents = snap.docs.map((d) => {
        const raw = d.data() as any;

        const date = raw.date?.toDate
          ? raw.date.toDate()
          : new Date(raw.date);

        return {
          id: d.id,
          ...raw,
          date,
          dateString: raw.dateString ?? raw.date?.toDate?.()?.toISOString?.()?.slice(0, 10) ?? "",
          kind: "event",
        } as Event;
      });

      updateCombined();
    });

    // -----------------------------
    // Listen to SERVICE PLANS
    // -----------------------------
    const spRef = collection(db, "churches", churchId, "servicePlans");
    const spQuery = query(spRef, orderBy("dateString", "asc"));

    const unsubSP = onSnapshot(spQuery, (snap) => {
      latestServices = snap.docs.map((d) => {
        const data = d.data() as ServicePlanFirestore;

        const date = new Date(`${data.dateString}T${data.timeString}:00`);

        return {
          id: d.id,
          title: data.title ?? "Service",
          isPublic: data.isPublic,
          groups: data.groups ?? [],
          date,
          dateString: data.dateString,   // ⭐ REQUIRED for Event type
          kind: "service",
        } as Event;
      });

      updateCombined();
    });

    return () => {
      unsubEvents();
      unsubSP();
    };
  }, [churchId, user]);

  return { events };
}
