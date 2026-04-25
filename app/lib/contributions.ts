import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { Contribution } from "./types";

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

  const supabase = getSupabaseClient();
  const payload: Record<string, unknown> = {
    church_id: churchId,
    member_name: data.memberName,
    amount: data.amount,
    category: data.category,
    contribution_type: data.contributionType,
    date: data.date,
    notes: data.notes ?? null,
  };

  if (data.memberId) payload.member_id = data.memberId;

  const { error } = await supabase.from("contributions").insert(payload);
  if (error) throw error;
}

export async function updateContribution(
  churchId: string,
  id: string,
  data: Partial<Omit<Contribution, "id">>
) {
  if (!churchId) throw new Error("Missing churchId");

  const supabase = getSupabaseClient();
  const updatePayload: Record<string, unknown> = {};

  if (data.memberId !== undefined) updatePayload.member_id = data.memberId;
  if (data.memberName !== undefined) updatePayload.member_name = data.memberName;
  if (data.amount !== undefined) updatePayload.amount = data.amount;
  if (data.category !== undefined) updatePayload.category = data.category;
  if (data.contributionType !== undefined) updatePayload.contribution_type = data.contributionType;
  if (data.date !== undefined) updatePayload.date = data.date;
  if (data.notes !== undefined) updatePayload.notes = data.notes;

  const { error } = await supabase
    .from("contributions")
    .update(updatePayload)
    .eq("id", id)
    .eq("church_id", churchId);

  if (error) throw error;
}

export async function deleteContribution(churchId: string, id: string) {
  if (!churchId) throw new Error("Missing churchId");

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("contributions")
    .delete()
    .eq("id", id)
    .eq("church_id", churchId);

  if (error) throw error;
}
