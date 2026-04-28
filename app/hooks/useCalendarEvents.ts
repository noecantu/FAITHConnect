import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { fromDateString } from "@/app/lib/date-utils";
import type { Event } from "@/app/lib/types";

type EventRow = {
  id: string;
  title: string;
  date_string: string;
  description?: string | null;
  notes?: string | null;
  visibility?: "public" | "private" | null;
  groups?: string[] | null;
};

function isValidDate(value: Date) {
  return Number.isFinite(value.getTime());
}

export function useCalendarEvents(churchId: string | undefined) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("church_id", churchId);

      if (!error) {
        const mapped: Event[] = ((data ?? []) as EventRow[])
          .map((row) => {
            const dateString = typeof row.date_string === "string" ? row.date_string : "";
            const date = fromDateString(dateString);

            return {
              id: row.id,
              title: row.title,
              dateString,
              date,
              description: row.description ?? undefined,
              notes: row.notes ?? undefined,
              visibility: (row.visibility === "public" ? "public" : "private") as "public" | "private",
              groups: Array.isArray(row.groups) ? row.groups : [],
            };
          })
          .filter((event) => event.dateString.length > 0 && isValidDate(event.date));

        setEvents(mapped);
      }
      setLoading(false);
    }

    fetchEvents();
  }, [churchId]);

  return { events, loading };
}
