import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import type { UserProfile, Event } from "@/app/lib/types";

export function useUpcomingEvents(churchId: string | null, user: UserProfile | null) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId || !user) return;

    const safeChurchId = churchId;
    const safeUser = user;

    async function load() {
      setLoading(true);

      const eventsRef = collection(db, "churches", safeChurchId, "events");

      const q = query(
        eventsRef,
        where("date", ">=", new Date()),
        orderBy("date", "asc"),
        limit(10)
      );

      const snapshot = await getDocs(q);

      // Correct normalization
      const normalize = (s: string) => {
        const lower = s.toLowerCase().replace(/group$/, "");

        if (lower === "women" || lower === "womens") return "women";
        if (lower === "men" || lower === "mens") return "men";

        return lower.replace(/s$/, "");
      };

      // Extract group memberships from roles
      const groupRoles = safeUser.roles.filter((r) =>
        r.endsWith("Group") || r.endsWith("GroupManager")
      );
      const userGroups = groupRoles.map((r) => normalize(r));

      const all: Event[] = snapshot.docs.map((d) => {
        const raw = d.data() as any;

        const date: Date =
          raw.date?.toDate ? raw.date.toDate() : new Date(raw.date);

        return {
          id: d.id,
          title: raw.title,
          description: raw.description ?? "",
          isPublic: raw.isPublic ?? false,
          groups: raw.groups ?? [],
          date,
          dateString: date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        };
      });

      const visible = all.filter((event) => {
        // Admin sees everything
        if (
          safeUser.roles.includes("churchAdmin") ||
          safeUser.roles.includes("systemAdmin")
        ) {
          return true;
        }

        // Public event
        if (event.isPublic) return true;

        // Private event — check group membership
        const eventGroups = event.groups.map((g) => normalize(g));
        const isInGroup = eventGroups.some((g) => userGroups.includes(g));

        return isInGroup;
      });

      setEvents(visible);
      setLoading(false);
    }

    load();
  }, [churchId, user]);

  return { events, loading };
}
