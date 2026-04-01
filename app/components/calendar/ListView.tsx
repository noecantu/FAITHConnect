"use client";

import * as React from "react";
import { format } from "date-fns";
import type { Event } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { usePreviewPagination } from "@/app/hooks/usePreviewPagination";
import { PreviewPaginationFooter } from "@/app/components/layout/PreviewPaginationFooter";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { can } from "@/app/lib/auth/permissions/can";

export function ListView({
  events,
  onEdit,
}: {
  events: Event[];
  onEdit?: (event: Event) => void;
  onDeleteRequest?: (id: string) => void;
}) {

  const { user } = useCurrentUser();
  const managerRoles = user?.roles?.filter(r => r.endsWith("GroupManager")) ?? [];
  const normalize = (g: string) =>
    g.toLowerCase().replace(/s$/, ""); // remove trailing s
  const managerGroups = managerRoles.map(r =>
    normalize(r.replace("GroupManager", ""))
  );

  // GROUP EVENTS BY DAY
  const grouped = React.useMemo(() => {
    const map = new Map<string, Event[]>();

    for (const e of events) {
      const key = format(e.date, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }

    return Array.from(map.entries());
  }, [events]);

  // PAGINATION — 20 groups per page
  const {
    page,
    totalPages,
    start,
    end,
    total,
    setPage,
    visible
  } = usePreviewPagination(grouped, 20);

  function canEditEvent(event: Event): boolean {
    const roles = user?.roles ?? [];

    // Admin / EventManager
    if (can(roles, "events.manage")) return true;
    if (can(roles, "church.manage")) return true;
    if (can(roles, "system.manage")) return true;

    // Normalize event groups
    const eventGroups = (event.groups ?? []).map(normalize);

console.log("DEBUG — managerGroups:", managerGroups);
console.log("DEBUG — eventGroups:", eventGroups);
console.log("DEBUG — raw event.groups:", event.groups);

    // Group manager match
    if (managerGroups.some(g => eventGroups.includes(g))) {
      return true;
    }

    return false;
  }

  return (
    <Card>
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
                  if (!canEditEvent(e)) return;
                  onEdit(e);
                }}
                onKeyDown={(ev) => {
                  if (!onEdit) return;
                  if (!canEditEvent(e)) return;

                  if (ev.key === "Enter" || ev.key === " ") {
                    onEdit(e);
                  }
                }}
                className="border rounded-md p-3 flex items-start justify-between cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <div>
                  <div className="font-medium">{e.title}</div>
                  {e.description && (
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

        {/* Unified footer */}
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
