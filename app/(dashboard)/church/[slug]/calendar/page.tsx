//app/(dashboard)/calendar/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/app/components/page-header";
import { Fab } from "@/app/components/ui/fab";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Calendar, CalendarDays, List } from "lucide-react";

import { useChurchId } from "@/app/hooks/useChurchId";
import { useCalendarEvents } from "@/app/hooks/useCalendarEvents";
import { useUpcomingServices } from "@/app/hooks/useUpcomingServices";
import { useCalendarMonth } from "@/app/hooks/useCalendarMonth";
import { useCalendarFilters } from "@/app/hooks/useCalendarFilters";
import { useCalendarView } from "@/app/hooks/useCalendarView";
import { CalendarControls } from "@/app/components/calendar/CalendarControls";
import { CalendarViewSwitcher } from "@/app/components/calendar/CalendarViewSwitcher";

import type { Role } from "@/app/lib/auth/roles";
import type { UserProfile, Event, ServicePlan } from "@/app/lib/types";
import { useParams, useRouter } from "next/navigation";
import { dateKey } from "@/app/lib/calendar/utils";
import { canUserSeeEvent } from "@/app/lib/canUserSeeEvent";
import { cn } from "@/app/lib/utils";
import { usePermissions } from "@/app/hooks/usePermissions";
import { addDays, format, isToday, isTomorrow } from "date-fns";

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

  const { events } = useCalendarEvents(effectiveChurchId ?? undefined);
  const { services } = useUpcomingServices(effectiveChurchId ?? undefined);

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
        memberIds: "memberIds" in item ? item.memberIds : [],
      })
    );
  }, [merged, user, isRegionalAdmin, isAuditor]);

  const month = useCalendarMonth();
  const filters = useCalendarFilters<CalendarItem>(visible);
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  const todayKey = dateKey(new Date());

  const upcoming = useMemo(() => {
    const now = new Date();
    return [...filters.filtered]
      .filter((item) => item.date.getTime() >= now.getTime())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 8);
  }, [filters.filtered]);

  const todayCount = useMemo(() => {
    return filters.filtered.filter((item) => dateKey(item.date) === todayKey).length;
  }, [filters.filtered, todayKey]);

  const nextSevenDaysCount = useMemo(() => {
    const end = addDays(new Date(), 7).getTime();
    return filters.filtered.filter((item) => {
      const time = item.date.getTime();
      return time >= new Date().getTime() && time <= end;
    }).length;
  }, [filters.filtered]);

  const selectedDayEvents = useMemo(() => {
    const key = dateKey(selectedDay);
    return [...filters.filtered]
      .filter((item) => dateKey(item.date) === key)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [filters.filtered, selectedDay]);

  const formatAgendaDate = (date: Date) => {
    if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow, ${format(date, "h:mm a")}`;
    return format(date, "EEE, MMM d • h:mm a");
  };

  const { view, setView } = useCalendarView("calendar");
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

      {view === "calendar" ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <CalendarViewSwitcher
              view={view}
              month={month.month}
              events={filters.filtered}
              onSelectDate={(date) => {
                setSelectedDay(date);
              }}
              selectedDate={selectedDay}
              density={density}
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
          </div>

          <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl h-fit xl:sticky xl:top-24">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-5 w-5 text-sky-400" />
                Agenda Snapshot
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 rounded-md border border-white/15 bg-black/50 p-2">
                <Button
                  type="button"
                  variant={density === 'comfortable' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setDensity('comfortable')}
                >
                  Comfortable
                </Button>
                <Button
                  type="button"
                  variant={density === 'compact' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setDensity('compact')}
                >
                  Compact
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-md border border-white/15 bg-black/50 p-3">
                  <p className="text-xs text-muted-foreground">Today</p>
                  <p className="text-xl font-semibold">{todayCount}</p>
                </div>

                <div className="rounded-md border border-white/15 bg-black/50 p-3">
                  <p className="text-xs text-muted-foreground">Next 7 Days</p>
                  <p className="text-xl font-semibold">{nextSevenDaysCount}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-xs text-white/80">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Service Plan
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-xs text-white/80">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Event
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Selected Day</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const key = dateKey(selectedDay);
                      router.push(`/church/${routeSlug}/calendar/day/${key}`);
                    }}
                  >
                    Open Day View
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{format(selectedDay, 'EEEE, MMMM d, yyyy')}</p>

                {selectedDayEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items for this day.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedDayEvents.map((item) => (
                      <button
                        key={`selected-${item.type}-${item.id}`}
                        type="button"
                        onClick={() => {
                          if (item.type === "service") {
                            router.push(`/church/${routeSlug}/service-plan/${item.id}`);
                            return;
                          }
                          router.push(`/church/${routeSlug}/calendar/${item.id}`);
                        }}
                        className="w-full rounded-md border border-white/15 bg-black/50 p-3 text-left transition-colors hover:bg-white/5"
                        style={{
                          borderLeftWidth: '4px',
                          borderLeftColor: item.type === 'service' ? '#22d3ee' : '#34d399',
                        }}
                      >
                        <p className="text-sm font-medium text-white/90 truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatAgendaDate(item.date)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Upcoming</p>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming events yet.</p>
                ) : (
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {upcoming.map((item) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        type="button"
                        onClick={() => {
                          if (item.type === "service") {
                            router.push(`/church/${routeSlug}/service-plan/${item.id}`);
                            return;
                          }

                          router.push(`/church/${routeSlug}/calendar/${item.id}`);
                        }}
                        className="w-full rounded-md border border-white/15 bg-black/50 p-3 text-left transition-colors hover:bg-white/5"
                        style={{
                          borderLeftWidth: '4px',
                          borderLeftColor: item.type === 'service' ? '#22d3ee' : '#34d399',
                        }}
                      >
                        <p className="text-sm font-medium text-white/90 truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatAgendaDate(item.date)}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <CalendarViewSwitcher
          view={view}
          month={month.month}
          events={filters.filtered}
          onSelectDate={(date) => {
            const key = dateKey(date);
            router.push(`/church/${routeSlug}/calendar/day/${key}`);
          }}
          selectedDate={selectedDay}
          density={density}
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
      )}

      {canManage && (
        <Fab type="add" onClick={() => router.push(`/church/${routeSlug}/calendar/new`)} />
      )}
    </>
  );
}