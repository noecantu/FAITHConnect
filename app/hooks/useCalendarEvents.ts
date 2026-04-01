'use client';

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import type { Event, UserProfile, ServicePlanFirestore } from "@/app/lib/types";
import { canUserSeeEvent } from "@/app/lib/canUserSeeEvent";
import { Role } from "../lib/auth/permissions/roles";

// --------------------------------------------------
// Normalizers
// --------------------------------------------------

function normalizeDate(raw: any): Date {
  if (!raw) return new Date();

  // Firestore Timestamp
  if (raw.toDate) return raw.toDate();

  // ISO string or date string
  if (typeof raw === "string") {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  }

  // JS Date
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

function normalizeServicePlan(raw: ServicePlanFirestore, id: string): Event {
  const date = new Date(`${raw.dateString}T${raw.timeString}:00`);

  return {
    id,
    title: raw.title ?? "Service",
    notes: raw.notes ?? "",
    date,
    dateString: raw.dateString,
    visibility: raw.isPublic ? "public" : "private",
    groups: Array.isArray(raw.groups) ? raw.groups : [],
  };
}

// --------------------------------------------------
// Main Hook
// --------------------------------------------------

export function useCalendarEvents(
  churchId: string | null,
  user: UserProfile | { id: string; roles: string[] } | null
) {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (!churchId || !user) {
      setEvents([]);
      return;
    }

    let latestEvents: Event[] = [];
    let latestServices: Event[] = [];

    const currentUser = {
      ...user,
      roles: user.roles as Role[],
    };

    function updateCombined() {
      const combined = [...latestEvents, ...latestServices];

      const visible = combined.filter((item) => {
        // Event Managers see everything
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
      latestEvents = snap.docs.map((d) =>
        normalizeEvent(d.data(), d.id)
      );

      updateCombined();
    });

    // -----------------------------
    // SERVICE PLANS
    // -----------------------------
    const spRef = collection(db, "churches", churchId, "servicePlans");
    const spQuery = query(spRef, orderBy("dateString", "asc"));

    const unsubSP = onSnapshot(spQuery, (snap) => {
      latestServices = snap.docs.map((d) =>
        normalizeServicePlan(d.data() as ServicePlanFirestore, d.id)
      );

      updateCombined();
    });

    return () => {
      unsubEvents();
      unsubSP();
    };
  }, [churchId, user]);

  return { events };
}
