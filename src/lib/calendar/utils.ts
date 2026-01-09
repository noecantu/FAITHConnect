import { format } from "date-fns";
import type { Event } from "@/lib/types";

export function dateKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export function groupEventsByDay(events: Event[]) {
  const map = new Map<string, Event[]>();
  for (const e of events) {
    const key = dateKey(e.date);
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  return map;
}