import { getSupabaseClient } from "@/app/lib/supabase/client";

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === "object") {
    const maybe = error as Record<string, unknown>;
    const parts = [maybe.error, maybe.message, maybe.code, maybe.details, maybe.hint]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
    if (parts.length > 0) return parts.join(" | ");
  }

  return fallback;
}

export async function createEvent(churchId: string, data: Record<string, unknown>) {
  if (!churchId) throw new Error("Missing churchId");

  const res = await fetch("/api/events/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ churchId, ...data }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(toErrorMessage(body, `Failed to create event (${res.status})`));
  }

  return body.row;
}

export async function updateEvent(
  churchId: string,
  eventId: string,
  data: Record<string, unknown>
) {
  if (!churchId) throw new Error("Missing churchId");
  if (!eventId) throw new Error("Missing eventId");

  const res = await fetch("/api/events/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ churchId, eventId, ...data }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(toErrorMessage(body, `Failed to update event (${res.status})`));
  }
}
