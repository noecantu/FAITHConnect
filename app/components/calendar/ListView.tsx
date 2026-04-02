"use client";

import * as React from "react";
import { format } from "date-fns";
import type { Event, ServicePlan } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { usePreviewPagination } from "@/app/hooks/usePreviewPagination";
import { PreviewPaginationFooter } from "@/app/components/layout/PreviewPaginationFooter";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { can } from "@/app/lib/auth/permissions/can";

type CalendarItem =
  | (Event & { type: "event" })
  | (ServicePlan & { type: "service" });

export function ListView({
  events,
  onEdit,
}: {
  events: CalendarItem[];
  onEdit?: (event: CalendarItem) => void;
  onDeleteRequest?: (id: string) => void;
}) {

  const { user } = useCurrentUser();
  const managerRoles = user?.roles?.filter(r => r.endsWith("GroupManager")) ?? [];
  const normalize = (g: string) =>
    g.toLowerCase().replace(/s$/, "");
  const managerGroups = managerRoles.map(r =>
    normalize(r.replace("GroupManager", ""))
  );

  // GROUP BY DAY
  const grouped = React.useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const e of events) {
      const key = format(e.date, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [events]);

  // PAGINATION
  const {
    page,
    totalPages,
    start,
    end,
    total,
    setPage,
    visible
  } = usePreviewPagination(grouped, 20);

  function canEditItem(item: CalendarItem): boolean {
    const roles = user?.roles ?? [];

    // ServicePlan
    if (item.type === "service") {
      return (
        can(roles, "events.manage") ||
        can(roles, "church.manage") ||
        can(roles, "system.manage")
      );
    }

    // Event
    if (can(roles, "events.manage")) return true;
    if (can(roles, "church.manage")) return true;
    if (can(roles, "system.manage")) return true;

    const eventGroups = (item.groups ?? []).map(normalize);
    return managerGroups.some(g => eventGroups.includes(g));
  }

  return (
    <Card className="relative bg-black/30 border-white/10 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>All Events</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {visible.map(([day, evts]) => (
          <div key={day}>
            <h3 className="font-semibold mb-2">
              {format(new Date(day), "PPP")}
            </h3>

            <ul className="space-y-2">
              {evts.map((e) => (
                <li
                  key={e.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (!onEdit) return;
                    if (!canEditItem(e)) return;
                    onEdit(e);
                  }}
                  onKeyDown={(ev) => {
                    if (!onEdit) return;
                    if (!canEditItem(e)) return;
                    if (ev.key === "Enter" || ev.key === " ") {
                      onEdit(e);
                    }
                  }}
                  className="border rounded-md p-3 flex items-start justify-between cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <div className="font-medium">{e.title}</div>

                    {"description" in e && e.description && (
                      <div className="text-sm text-muted-foreground">
                        {e.description}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <PreviewPaginationFooter
          start={start}
          end={end}
          total={total}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          label="event days"
        />
      </CardContent>
    </Card>
  );
}
