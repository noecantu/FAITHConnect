//app/(dashbaord)/[eventId]/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useChurchId } from "@/app/hooks/useChurchId";
import EventEditor from "@/app/components/calendar/EventEditor";
import { can } from "@/app/lib/auth/permissions";
import type { Permission } from "@/app/lib/auth/permissions";

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
  const supabase = getSupabaseClient();
  const router = useRouter();
  const routeParams = useParams();
  const routeSlug = String(routeParams?.slug ?? "");
  const calendarPath = `/church/${routeSlug}/calendar`;
  const { user } = useCurrentUser();
  const { church_id } = useChurchId();

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
      if (!church_id) return;

      const { data: raw } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .eq("church_id", church_id)
        .single();

      if (raw) {
        const parsedDate =
          typeof raw.date === "string" || raw.date instanceof Date
            ? new Date(raw.date)
            : null;

        setEventData({
          ...raw,
          id: eventId,
          date: parsedDate ?? new Date(),
          dateString: raw.date_string ?? "",
          timeString: raw.time_string ?? "00:00",
          memberIds: Array.isArray(raw.member_ids) ? raw.member_ids : [],
        });
      } else {
        setEventData(null);
      }

      setLoading(false);
    }

    load();
  }, [church_id, eventId]);

  // Permission logic
  function canEditEvent(event: any): boolean {
    const roles = user?.roles ?? [];
    const grants = (user?.permissions ?? []) as Permission[];

    // Admin / EventManager
    if (can(roles, "events.manage", grants)) return true;
    if (can(roles, "church.manage", grants)) return true;
    if (can(roles, "system.manage", grants)) return true;

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
