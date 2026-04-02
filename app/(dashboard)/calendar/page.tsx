"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/app/components/page-header";
import { Fab } from "@/app/components/ui/fab";
import { Button } from "@/app/components/ui/button";
import { Calendar, List } from "lucide-react";

import { useChurchId } from "@/app/hooks/useChurchId";
import { useCalendarEvents } from "@/app/hooks/useCalendarEvents";
import { useUpcomingServices } from "@/app/hooks/useUpcomingServices";
import { useCalendarMonth } from "@/app/hooks/useCalendarMonth";
import { useCalendarFilters } from "@/app/hooks/useCalendarFilters";
import { CalendarControls } from "@/app/components/calendar/CalendarControls";
import { CalendarViewSwitcher } from "@/app/components/calendar/CalendarViewSwitcher";

import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/roleGroups";
import type { UserProfile, Event, ServicePlan } from "@/app/lib/types";
import { useUserCalendarSettings } from "@/app/hooks/useUserCalendarSettings";
import { useRouter } from "next/navigation";
import { dateKey } from "@/app/lib/calendar/utils";
import { canUserSeeEvent } from "@/app/lib/canUserSeeEvent";

type CalendarItem =
  | (Event & { type: "event" })
  | (ServicePlan & { type: "service" });

export default function CalendarPage() {
  const router = useRouter();
  const { churchId } = useChurchId();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/users/me");
      const raw = await res.json();

      const profile: UserProfile = {
        ...raw,
        roles: raw.roles as Role[],
      };

      setUser(profile);
      setLoadingUser(false);
    }

    load();
  }, []);

  const roles = user?.roles ?? [];
  const isAdmin =
    can(roles, "church.manage") || can(roles, "system.manage");

  const canManage =
    can(roles, "events.manage") || isAdmin;

  const { events } = useCalendarEvents(churchId, user);

  const { services } = useUpcomingServices(churchId);

  const merged: CalendarItem[] = useMemo(() => {
    const serviceItems: CalendarItem[] = services.map((sp) => ({
      ...sp,
      type: "service",
      _key: `service-${sp.id}`,
    }));

    const realEvents: CalendarItem[] = events.map((ev) => ({
      ...ev,
      type: "event",
      _key: `event-${ev.id}`,
    }));

    return [...realEvents, ...serviceItems];
  }, [events, services]);

  const visible = useMemo(() => {
    if (!user) return [];

    return merged.filter((item) =>
      canUserSeeEvent(user, {
        visibility: item.visibility,
        groups: item.groups,
      })
    );
  }, [merged, user]);

  const month = useCalendarMonth();

  const filters = useCalendarFilters<CalendarItem>(visible);

  const { view, setView } = useUserCalendarSettings(user?.id ?? null);
  const viewControls = { view, setView };

  if (loadingUser) return <div className="p-6">Loading...</div>;
  if (!user) return <div className="p-6">No user found.</div>;

  return (
    <>
      <PageHeader
        title="Calendar of Events"
        subtitle="Select a date to view or add events."
      >
        <div className="flex items-center gap-2">
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("calendar")}
          >
            <Calendar className="h-5 w-5" />
          </Button>

          <Button
            variant={view === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("list")}
          >
            <List className="h-5 w-5" />
          </Button>
        </div>
      </PageHeader>

      <CalendarControls
        month={month}
        view={viewControls}
        filters={filters}
        user={user}
        events={filters.filtered}
      />

      <CalendarViewSwitcher
        view={view}
        month={month.month}
        events={filters.filtered}
        onSelectDate={(date) => {
          const key = dateKey(date);
          router.push(`/calendar/day/${key}`);
        }}
        onPrevMonth={month.prevMonth}
        onNextMonth={month.nextMonth}
        canManage={canManage}
        onEdit={(event) => {
          if (!canManage) return;

          // ServicePlan
          if ("timeString" in event) {
            router.push(`/service-plan/${event.id}`);
            return;
          }

          // Event
          router.push(`/events/${event.id}`);
        }}
      />

      {canManage && (
        <Fab type="add" onClick={() => router.push("/events/new")} />
      )}
    </>
  );
}
