"use client";

import { use } from "react";
import { useMemo } from "react";
import { useCalendarEvents } from "@/app/hooks/useCalendarEvents";
import { useUpcomingServices } from "@/app/hooks/useUpcomingServices";
import { useChurchId } from "@/app/hooks/useChurchId";
import { PageHeader } from "@/app/components/page-header";
import { ListView } from "@/app/components/calendar/ListView";
import { dateKey } from "@/app/lib/calendar/utils";
import { parse } from "date-fns";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import type { Event, ServicePlan } from "@/app/lib/types";

type CalendarItem =
  | (Event & { type: "event" })
  | (ServicePlan & { type: "service" });

export default function DayEventsPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const router = useRouter();
  const { date } = use(params);

  const dayKey = date;
  const day = parse(dayKey, "yyyy-MM-dd", new Date());

  const { churchId } = useChurchId();
  const { user } = useCurrentUser();

  const { events } = useCalendarEvents(churchId, user);
  const { services } = useUpcomingServices(churchId);

  const merged: CalendarItem[] = useMemo(() => {
    return [
      ...events.map(e => ({ ...e, type: "event" as const })),
      ...services.map(s => ({ ...s, type: "service" as const })),
    ];
  }, [events, services]);

  const filtered = useMemo(() => {
    return merged.filter((e) => dateKey(e.date) === dayKey);
  }, [merged, dayKey]);

  return (
    <>
      <PageHeader
        title={`Events for ${day.toDateString()}`}
        subtitle="All events scheduled for this day."
      />

      <ListView
        events={filtered}
        onEdit={(item) => {
          if (item.type === "service") {
            router.push(`/service-plan/${item.id}`);
          } else {
            router.push(`/events/${item.id}`);
          }
        }}
      />
    </>
  );
}
