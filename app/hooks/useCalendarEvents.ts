import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { fromDateString } from "@/app/lib/date-utils";
import type { Event } from "@/app/lib/types";

type EventRow = {
  id: string;
  title: string;
  date_string: string;
  time_string?: string | null;
  description?: string | null;
  notes?: string | null;
  visibility?: "public" | "private" | null;
  groups?: string[] | null;
  member_ids?: string[] | null;
};

function normalizeTimeString(value: string | null | undefined): string {
  if (typeof value !== "string") return "00:00";
  return /^\d{2}:\d{2}$/.test(value) ? value : "00:00";
}

function toEventDate(dateString: string, timeString: string): Date {
  const combined = new Date(`${dateString}T${timeString}:00`);
  if (isValidDate(combined)) return combined;
  return fromDateString(dateString);
}

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
            const timeString = normalizeTimeString(row.time_string);
            const date = toEventDate(dateString, timeString);

            return {
              id: row.id,
              title: row.title,
              dateString,
              timeString,
              date,
              description: row.description ?? undefined,
              notes: row.notes ?? undefined,
              visibility: (row.visibility === "public" ? "public" : "private") as "public" | "private",
              groups: Array.isArray(row.groups) ? row.groups : [],
              memberIds: Array.isArray(row.member_ids) ? row.member_ids : [],
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
