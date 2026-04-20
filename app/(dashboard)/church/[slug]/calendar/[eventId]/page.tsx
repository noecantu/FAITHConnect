//app/(dashbaord)/[eventId]/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useChurchId } from "@/app/hooks/useChurchId";
import EventEditor from "@/app/components/calendar/EventEditor";
import { can } from "@/app/lib/auth/permissions";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const router = useRouter();
  const routeParams = useParams();
  const routeSlug = String(routeParams?.slug ?? "");
  const calendarPath = `/church/${routeSlug}/calendar`;
  const { user } = useCurrentUser();
  const { churchId } = useChurchId();

  const { eventId } = use(params);

  const [eventData, setEventData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Manager group extraction
  const managerRoles =
    user?.roles?.filter((r) => r.endsWith("GroupManager")) ?? [];

  const normalize = (g: string) =>
    g.toLowerCase().replace(/s$/, "");

  const managerGroups = managerRoles.map((r) =>
    normalize(r.replace("GroupManager", ""))
  );

  // Load event from Firestore
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

  // Permission logic
  function canEditEvent(event: any): boolean {
    const roles = user?.roles ?? [];

    // Admin / EventManager
    if (can(roles, "events.manage")) return true;
    if (can(roles, "church.manage")) return true;
    if (can(roles, "system.manage")) return true;

    // Normalize event groups
    const eventGroups = (event.groups ?? []).map(normalize);

    // Group manager match
    if (managerGroups.some((g) => eventGroups.includes(g))) {
      return true;
    }

    return false;
  }

  // --- Unauthorized ---
  if (!loading && (!eventData || !canEditEvent(eventData))) {
    return (
      <Dialog open={true} onOpenChange={() => router.push(calendarPath)}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[85dvh] flex flex-col p-0">
          <VisuallyHidden>
            <DialogTitle>Unauthorized</DialogTitle>
          </VisuallyHidden>

          <div className="p-6">
            <h1 className="text-xl font-semibold">Unauthorized</h1>
            <p className="text-sm text-muted-foreground">
              You do not have permission to edit this event.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // --- Loading ---
  if (loading) {
    return (
      <Dialog open={true} onOpenChange={() => router.push(calendarPath)}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[85dvh] flex flex-col p-0">
          <VisuallyHidden>
            <DialogTitle>Loading</DialogTitle>
          </VisuallyHidden>

          <div className="p-6">Loading…</div>
        </DialogContent>
      </Dialog>
    );
  }

  // --- Not Found ---
  if (!eventData) {
    return (
      <Dialog open={true} onOpenChange={() => router.push(calendarPath)}>
        <DialogContent className="w-[95vw] max-w-lg max-h-[85dvh] flex flex-col p-0">
          <VisuallyHidden>
            <DialogTitle>Not Found</DialogTitle>
          </VisuallyHidden>

          <div className="p-6">
            <h1 className="text-xl font-semibold">Not Found</h1>
            <p className="text-sm text-muted-foreground">
              This event does not exist.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // --- Normal Edit Event Dialog ---
  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) router.push(calendarPath);
      }}
    >
      <DialogContent
        className="w-[95vw] max-w-lg max-h-[85dvh] flex flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>Update this calendar event.</DialogDescription>
        </DialogHeader>

        <EventEditor
          mode="edit"
          initialEvent={eventData}
          onCancel={() => router.push(calendarPath)}
          onSaved={() => router.push(calendarPath)}
        />
      </DialogContent>
    </Dialog>
  );
}
