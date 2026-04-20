//app/(dashboard)/calendar/page.tsx
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

import type { Role } from "@/app/lib/auth/roles";
import type { UserProfile, Event, ServicePlan } from "@/app/lib/types";
import { useUserCalendarSettings } from "@/app/hooks/useUserCalendarSettings";
import { useParams, useRouter } from "next/navigation";
import { dateKey } from "@/app/lib/calendar/utils";
import { canUserSeeEvent } from "@/app/lib/canUserSeeEvent";
import { cn } from "@/app/lib/utils";
import { usePermissions } from "@/app/hooks/usePermissions";

type CalendarItem =
  | (Event & { type: "event" })
  | (ServicePlan & { type: "service" });

export default function CalendarPage() {
  const router = useRouter();
  const params = useParams();
  const routeSlug = String(params?.slug ?? "");
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

  const {
    canManageEvents,
    isAuditor,
    isRegionalAdmin,
  } = usePermissions();

  const isReadOnly = isAuditor || isRegionalAdmin;
  const canManage = !isReadOnly && canManageEvents;

  const effectiveChurchId = churchId;

  const { events } = useCalendarEvents(effectiveChurchId);
  const { services } = useUpcomingServices(effectiveChurchId);

  const merged: CalendarItem[] = useMemo(() => {
    const serviceItems: CalendarItem[] = services.map((sp) => ({
      ...sp,
      type: "service",
      _key: `service-${sp.id}`,
    }));

    const eventItems: CalendarItem[] = events.map((ev) => ({
      ...ev,
      type: "event",
      _key: `event-${ev.id}`,
    }));

    return [...eventItems, ...serviceItems];
  }, [events, services]);

  const visible = useMemo(() => {
    if (!user) return [];

    if (isRegionalAdmin || isAuditor) {
      return merged;
    }

    return merged.filter((item) =>
      canUserSeeEvent(user, {
        visibility: item.visibility,
        groups: item.groups,
      })
    );
  }, [merged, user, isRegionalAdmin, isAuditor]);

  const month = useCalendarMonth();
  const filters = useCalendarFilters<CalendarItem>(visible);

  const { view, setView } = useUserCalendarSettings(user?.uid ?? null);
  const viewControls = { view, setView };

  if (loadingUser) return <>Loading...</>;
  if (!user) return <>No user found.</>;
  if (!effectiveChurchId || !routeSlug) return <>Loading calendar...</>;

  return (
    <>
      <PageHeader
        title="Calendar of Events"
        subtitle="Select a date to view or add events."
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setView("calendar")}
            className={cn(
              "flex items-center gap-2",
              "bg-black/80 border border-white/20 backdrop-blur-xl",
              "hover:bg-white/5 hover:border-white/20 transition",
              view === "calendar" && "bg-white/10 border-white/20"
            )}
          >
            Calendar
            <Calendar className="h-5 w-5" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-2",
              "bg-black/80 border border-white/20 backdrop-blur-xl",
              "hover:bg-white/5 hover:border-white/20 transition",
              view === "list" && "bg-white/10 border-white/20"
            )}
          >
            List
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
          router.push(`/church/${routeSlug}/calendar/day/${key}`);
        }}
        onPrevMonth={month.prevMonth}
        onNextMonth={month.nextMonth}
        canManage={canManage}
        onEdit={(event) => {
          if (!canManage) return;

          if ("timeString" in event) {
            router.push(`/church/${routeSlug}/service-plan/${event.id}`);
            return;
          }

          router.push(`/church/${routeSlug}/calendar/${event.id}`);
        }}
      />

      {canManage && (
        <Fab type="add" onClick={() => router.push(`/church/${routeSlug}/calendar/new`)} />
      )}
    </>
  );
}