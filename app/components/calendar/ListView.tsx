import * as React from "react";
import { format } from "date-fns";
import type { Event } from "@/app/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Pencil, Trash2 } from "lucide-react";

export function ListView({
  events,
  onEdit,
  onDeleteRequest,
}: {
  events: Event[];
  onEdit?: (event: Event) => void;
  onDeleteRequest?: (id: string) => void;
}) {
  const grouped = React.useMemo(() => {
    // Events are already sorted by the filter hook.
    // We simply group them in the order they arrive.
    const map = new Map<string, Event[]>();

    for (const e of events) {
      const key = format(e.date, "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }

    // DO NOT re-sort the keys — preserve the sorted order
    return Array.from(map.entries());
  }, [events]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Events</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {grouped.map(([day, evts]) => (
          <div key={day}>
            <h3 className="font-semibold mb-2">{format(new Date(day), "PPP")}</h3>

            <ul className="space-y-2">
              {evts.map((e) => (
                <li
                  key={e.id}
                  className="border rounded-md p-3 flex items-start justify-between"
                >
                  <div>
                    <div className="font-medium">{e.title}</div>
                    {e.description && (
                      <div className="text-sm text-muted-foreground">
                        {e.description}
                      </div>
                    )}
                  </div>

                  {(onEdit || onDeleteRequest) && (
                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <Button variant="ghost" size="icon" onClick={() => onEdit(e)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}

                      {onDeleteRequest && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteRequest(e.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  )}
                  
                </li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}