'use client';

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import type { Event, UserProfile } from "@/app/lib/types";
import { canUserSeeEvent } from "@/app/lib/canUserSeeEvent";
import { Role } from "../lib/auth/roles";

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

export function useCalendarEvents(
  churchId: string | null,
  user: UserProfile | { id: string; roles: string[] } | null
) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!churchId || !user) return;

    let latestEvents: Event[] = [];

    const currentUser = {
      ...user,
      roles: user.roles as Role[],
    };

    const eventsRef = collection(db, "churches", churchId, "events");
    const eventsQuery = query(eventsRef, orderBy("date", "asc"));

    const unsub = onSnapshot(eventsQuery, (snap) => {
      latestEvents = snap.docs.map((d) =>
        normalizeEvent(d.data(), d.id)
      );

    const visible = latestEvents.filter((item) => {
      // Regional Admins + Auditors can see ALL events
      if (
        currentUser.roles.includes("RegionalAdmin") ||
        currentUser.roles.includes("Auditor")
      ) {
        return true;
      }

      // Event Managers can see all events
      if (currentUser.roles.includes("EventManager")) return true;

      // Everyone else uses visibility rules
      return canUserSeeEvent(currentUser, {
        visibility: item.visibility,
        groups: item.groups,
      });
    });

      visible.sort((a, b) => a.date.getTime() - b.date.getTime());
      setEvents(visible);
    });

    return () => unsub();
  }, [churchId, user]);

  return { events };
}
