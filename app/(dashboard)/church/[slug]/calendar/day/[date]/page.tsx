"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { PageHeader } from "@/app/components/page-header";
import { Button } from "@/app/components/ui/button";
import { Fab } from "@/app/components/ui/fab";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useCalendarEvents } from "@/app/hooks/useCalendarEvents";
import { useUpcomingServices } from "@/app/hooks/useUpcomingServices";
import { useChurchId } from "@/app/hooks/useChurchId";
import { usePermissions } from "@/app/hooks/usePermissions";
import { dateKey } from "@/app/lib/calendar/utils";

export default function CalendarDayPage() {
  const router = useRouter();
  const params = useParams();

  const routeSlug = String(params?.slug ?? "");
  const selectedDateKey = String(params?.date ?? "");

  const { churchId } = useChurchId();
  const { canManageEvents, isAuditor, isRegionalAdmin } = usePermissions();

  const isReadOnly = isAuditor || isRegionalAdmin;
  const canManage = !isReadOnly && canManageEvents;

  const { events } = useCalendarEvents(churchId);
  const { services } = useUpcomingServices(churchId);

  const dayEvents = useMemo(
    () =>
      events
        .filter((event) => dateKey(event.date) === selectedDateKey)
        .sort((a, b) => a.date.getTime() - b.date.getTime()),
    [events, selectedDateKey]
  );

  const dayServices = useMemo(
    () =>
      services
        .filter((service) => service.dateString === selectedDateKey)
        .sort((a, b) => a.timeString.localeCompare(b.timeString)),
    [services, selectedDateKey]
  );

  const selectedDate = useMemo(() => {
    try {
      return parseISO(selectedDateKey);
    } catch {
      return new Date();
    }
  }, [selectedDateKey]);

  if (!routeSlug || !selectedDateKey) {
    return <div className="p-6 text-muted-foreground">Loading day view...</div>;
  }

  return (
    <>
      <PageHeader
        title="Day View"
        subtitle={format(selectedDate, "EEEE, MMMM d, yyyy")}
      >
        <Button asChild variant="outline" className="bg-black/80 border-white/20 text-white/80 hover:bg-white/5">
          <Link href={`/church/${routeSlug}/calendar`}>Back to Calendar</Link>
        </Button>
      </PageHeader>

      <div className="space-y-4">
        <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Events</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dayEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">No events scheduled for this day.</p>
            )}

            {dayEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                onClick={() => canManage && router.push(`/church/${routeSlug}/calendar/${event.id}`)}
                className="w-full rounded-md border border-white/15 bg-black/30 p-3 text-left transition hover:bg-white/5"
                disabled={!canManage}
              >
                <p className="font-medium">{event.title}</p>
                <p className="text-sm text-muted-foreground">{format(event.date, "h:mm a")}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Services</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dayServices.length === 0 && (
              <p className="text-sm text-muted-foreground">No service plans scheduled for this day.</p>
            )}

            {dayServices.map((service) => (
              <button
                key={service.id}
                type="button"
                onClick={() => canManage && router.push(`/church/${routeSlug}/service-plan/${service.id}`)}
                className="w-full rounded-md border border-white/15 bg-black/30 p-3 text-left transition hover:bg-white/5"
                disabled={!canManage}
              >
                <p className="font-medium">{service.title}</p>
                <p className="text-sm text-muted-foreground">{service.timeString}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {canManage && (
        <Fab type="add" onClick={() => router.push(`/church/${routeSlug}/calendar/new`)} />
      )}
    </>
  );
}
