"use client";

import { use } from "react";
import { useMemo } from "react";
import { useCalendarEvents } from "@/app/hooks/useCalendarEvents";
import { useChurchId } from "@/app/hooks/useChurchId";
import { PageHeader } from "@/app/components/page-header";
import { ListView } from "@/app/components/calendar/ListView";
import { dateKey } from "@/app/lib/calendar/utils";
import { parse } from "date-fns";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";

export default function DayEventsPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const router = useRouter();
  const { date } = use(params); // "2026-04-03"

  const dayKey = date;
  const day = parse(dayKey, "yyyy-MM-dd", new Date());

  const { churchId } = useChurchId();
  const { user } = useCurrentUser();
  const { events } = useCalendarEvents(churchId, user);

  const filtered = useMemo(() => {
    return events.filter((e) => dateKey(e.date) === dayKey);
  }, [events, dayKey]);

  return (
    <>
      <PageHeader
        title={`Events for ${day.toDateString()}`}
        subtitle="All events scheduled for this day."
      />

      <ListView
        events={filtered}
        onEdit={(event) => router.push(`/events/${event.id}`)}
        onDeleteRequest={() => {}}
      />
    </>
  );
}
