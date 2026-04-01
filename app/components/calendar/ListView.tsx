"use client";

import * as React from "react";
import { format } from "date-fns";
import type { Event } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { usePreviewPagination } from "@/app/hooks/usePreviewPagination";
import { PreviewPaginationFooter } from "@/app/components/layout/PreviewPaginationFooter";

export function ListView({
  events,
  onEdit,
}: {
  events: Event[];
  onEdit?: (event: Event) => void;
  onDeleteRequest?: (id: string) => void;
}) {
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
                onClick={() => onEdit?.(e)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter" || ev.key === " ") onEdit?.(e);
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
