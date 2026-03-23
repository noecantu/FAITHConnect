"use client";

import { useEffect, useState } from "react";
import { useMemberPortal } from "../MemberPortalContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { Card, CardContent } from "@/app/components/ui/card";
import { format } from "date-fns";
import { Link } from "lucide-react";

type EventItem = {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  isPublic?: boolean;
  groups?: string[];
};

export default function MemberPortalCalendar() {
  const { member, churchId } = useMemberPortal();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const ref = collection(db, "churches", churchId, "events");
      const snap = await getDocs(ref);

      const allEvents = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as EventItem[];

      // Filter events:
      // 1. Public events
      // 2. Events where member belongs to the required group(s)
      const memberGroups = member.groups ?? [];

      const filtered = allEvents.filter((ev) => {
        if (ev.isPublic) return true;
        if (!ev.groups || ev.groups.length === 0) return false;
        return ev.groups.some((g) => memberGroups.includes(g));
      });

      setEvents(filtered);
      setLoading(false);
    }

    loadEvents();
  }, [churchId, member]);

  if (loading) {
    return <p className="text-white/70">Loading events…</p>;
  }

  if (events.length === 0) {
    return <p className="text-white/60">No upcoming events.</p>;
  }

  return (
    <div className="flex flex-col gap-4 max-w-xl mx-auto">
        <Link href="/member-portal/home" className="text-white/60 text-sm hover:text-white/90">
         ← Back to Home
        </Link>

      {events.map((ev) => (
        <Card
          key={ev.id}
          className="bg-white/5 border-white/10 backdrop-blur-sm"
        >
          <CardContent className="p-4 flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-white/90">
              {ev.title}
            </h3>

            <p className="text-white/70 text-sm">
              {format(new Date(ev.date), "EEEE, MMM d")}
              {ev.time ? ` at ${ev.time}` : ""}
            </p>

            {ev.location && (
              <p className="text-white/60 text-sm">
                Location: {ev.location}
              </p>
            )}

            {ev.description && (
              <p className="text-white/60 text-sm">{ev.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
