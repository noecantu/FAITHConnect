"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useChurchId } from "@/app/hooks/useChurchId";
import EventEditor from "@/app/components/calendar/EventEditor";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const router = useRouter();
  const { canManageEvents } = useCurrentUser();
  const { churchId } = useChurchId();

  const { eventId } = use(params);

  const [eventData, setEventData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Load event
  useEffect(() => {
    async function load() {
      if (!churchId) return;
      const ref = doc(db, "churches", churchId, "events", eventId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const raw = snap.data();
        setEventData({
          id: eventId,
          ...raw,
          date: raw.date?.toDate ? raw.date.toDate() : new Date(raw.date),
        });
      } else {
        setEventData(null);
      }

      setLoading(false);
    }

    load();
  }, [churchId, eventId]);


  // Permission check AFTER hooks
  if (!canManageEvents) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to edit events.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Loading…</div>;
  }

  if (!eventData) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Not Found</h1>
        <p className="text-sm text-muted-foreground">
          This event does not exist.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Edit Event</h1>

      <EventEditor
        mode="edit"
        initialEvent={eventData}
        onCancel={() => router.push("/calendar")}
        onSaved={() => router.push("/calendar")}
      />
    </div>
  );
}
