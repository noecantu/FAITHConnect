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

    let latestEvents: Event[] = [];
    let latestServices: Event[] = [];

    if (!churchId || !user) {
      setEvents([]);
      return;
    }

    const currentUser = user; // ⭐ non-null guarantee

    function updateCombined() {
      const combined = [...latestEvents, ...latestServices];

      const visible = combined.filter((item) => {
        if (currentUser.roles.includes("EventManager")) return true;

        return canUserSeeEvent(currentUser, {
          visibility: item.visibility,
          groups: item.groups,
        });
      });

      visible.sort((a, b) => a.date.getTime() - b.date.getTime());
      setEvents(visible);
    }

    // -----------------------------
    // EVENTS
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
          title: raw.title ?? "Event",
          date,
          dateString:
            raw.dateString ??
            raw.date?.toDate?.()?.toISOString?.()?.slice(0, 10) ??
            "",
          visibility: raw.isPublic ? "public" : "private",
          groups: raw.groups ?? [],
        } satisfies Event;
      });

      updateCombined();
    });

    // -----------------------------
    // SERVICE PLANS
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
          date,
          dateString: data.dateString,
          visibility: data.isPublic ? "public" : "private",
          groups: data.groups ?? [],
        } satisfies Event;
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
