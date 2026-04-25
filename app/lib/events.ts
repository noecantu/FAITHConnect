import { getSupabaseClient } from "@/app/lib/supabase/client";

export async function createEvent(churchId: string, data: Record<string, unknown>) {
  if (!churchId) throw new Error("Missing churchId");

  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase
    .from("events")
    .insert({
      church_id: churchId,
      title: data.title,
      date_string: data.dateString ?? data.date_string,
      description: data.description ?? null,
      notes: data.notes ?? null,
      visibility: data.visibility ?? "private",
      groups: data.groups ?? [],
    })
    .select()
    .single();

  if (error) throw error;
  return row;
}

export async function updateEvent(
  churchId: string,
  eventId: string,
  data: Record<string, unknown>
) {
  if (!churchId) throw new Error("Missing churchId");
  if (!eventId) throw new Error("Missing eventId");

  const supabase = getSupabaseClient();
  const updatePayload: Record<string, unknown> = {};

  if (data.title !== undefined) updatePayload.title = data.title;
  if (data.dateString !== undefined) updatePayload.date_string = data.dateString;
  if (data.date_string !== undefined) updatePayload.date_string = data.date_string;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.notes !== undefined) updatePayload.notes = data.notes;
  if (data.visibility !== undefined) updatePayload.visibility = data.visibility;
  if (data.groups !== undefined) updatePayload.groups = data.groups;

  const { error } = await supabase
    .from("events")
    .update(updatePayload)
    .eq("id", eventId)
    .eq("church_id", churchId);

  if (error) throw error;
}
