"use client";

import { useParams, useRouter } from "next/navigation";
import EventEditor from "@/app/components/calendar/EventEditor";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

export default function NewEventPage() {
  const router = useRouter();
  const params = useParams();
  const routeSlug = String(params?.slug ?? "");
  const calendarPath = `/church/${routeSlug}/calendar`;

  return (
    <Dialog
      open={true}
      modal={false}
      onOpenChange={(open) => {
        if (!open) router.push(calendarPath);
      }}
    >
      <DialogContent
        className="w-[95vw] max-w-lg max-h-[85dvh] flex flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>Add Event</DialogTitle>
          <DialogDescription>Create a new calendar event.</DialogDescription>
        </DialogHeader>

        <EventEditor
          mode="create"
          initialEvent={null}
          onCancel={() => router.push(calendarPath)}
          onSaved={() => router.push(calendarPath)}
        />
      </DialogContent>
    </Dialog>
  );
}
