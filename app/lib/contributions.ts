import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { Contribution } from "./types";

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;

  if (error && typeof error === "object") {
    const maybe = error as Record<string, unknown>;
    const parts = [maybe.message, maybe.code, maybe.details, maybe.hint]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0);
    if (parts.length > 0) return parts.join(" | ");
  }

  return fallback;
}

export function listenToContributions(
  churchId: string,
  callback: (contributions: Contribution[]) => void
): () => void {
  if (!churchId) return () => {};

  getSupabaseClient()
    .from("contributions")
    .select("*")
    .eq("church_id", churchId)
    .order("date", { ascending: false })
    .then(({ data }) => {
      if (!data) return;
      const contributions: Contribution[] = data.map((row) => ({
        id: row.id,
        memberId: row.member_id ?? undefined,
        memberName: row.member_name,
        amount: row.amount,
        category: row.category,
        contributionType: row.contribution_type,
        date: row.date,
        notes: row.notes ?? "",
      }));
      callback(contributions);
    });

  // Return a no-op unsubscribe (no real-time listener needed)
  return () => {};
}

export async function addContribution(
  churchId: string,
  data: Omit<Contribution, "id">
) {
  if (!churchId) throw new Error("Missing churchId");

  const res = await fetch("/api/contributions/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      churchId,
      memberId: data.memberId,
      memberName: data.memberName,
      amount: data.amount,
      category: data.category,
      contributionType: data.contributionType,
      date: data.date,
      notes: data.notes ?? null,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(toErrorMessage(body, `Failed to add contribution (${res.status})`));
  }
}

export async function updateContribution(
  churchId: string,
  id: string,
  data: Partial<Omit<Contribution, "id">>
) {
  if (!churchId) throw new Error("Missing churchId");

  const res = await fetch("/api/contributions/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      churchId,
      id,
      memberId: data.memberId,
      memberName: data.memberName,
      amount: data.amount,
      category: data.category,
      contributionType: data.contributionType,
      date: data.date,
      notes: data.notes,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(toErrorMessage(body, `Failed to update contribution (${res.status})`));
  }
}

export async function deleteContribution(churchId: string, id: string) {
  if (!churchId) throw new Error("Missing churchId");

  const res = await fetch("/api/contributions/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ churchId, id }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(toErrorMessage(body, `Failed to delete contribution (${res.status})`));
  }
}
