import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import type { UserProfile, Event } from "@/app/lib/types";
import { canUserSeeEvent } from "@/app/lib/canUserSeeEvent";

export function useUpcomingEvents(churchId: string | null, user: UserProfile | null) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId || !user) return;

    const safeChurchId = churchId;
    const currentUser = user; // ⭐ non-null guarantee

    async function load() {
      setLoading(true);

      try {
        const eventsRef = collection(db, "churches", safeChurchId, "events");

        const q = query(
          eventsRef,
          where("date", ">=", new Date()),
          orderBy("date", "asc"),
          limit(10)
        );

        const snapshot = await getDocs(q);

        const all: Event[] = snapshot.docs.map((d) => {
          const raw = d.data() as any;

          const date: Date =
            raw.date?.toDate ? raw.date.toDate() : new Date(raw.date);

          return {
            id: d.id,
            title: raw.title ?? "Event",
            description: raw.description ?? "",
            date,
            dateString: date.toISOString().slice(0, 10),
            visibility: raw.isPublic ? "public" : "private",
            groups: raw.groups ?? [],
          } satisfies Event;
        });

        const visible = all.filter((event) =>
          canUserSeeEvent(currentUser, {
            visibility: event.visibility,
            groups: event.groups,
          })
        );

        setEvents(visible);
      } catch (err: unknown) {
        const code = (err as { code?: string }).code;
        if (code !== "permission-denied") {
          console.error("useUpcomingEvents load error:", err);
        }
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [churchId, user]);

  return { events, loading };
}
