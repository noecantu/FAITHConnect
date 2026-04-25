import { getSupabaseClient } from "@/app/lib/supabase/client";

export async function duplicateSetList(
  churchId: string,
  setListId: string,
  router: { push: (path: string) => void }
) {
  try {
    const supabase = getSupabaseClient();

    // Fetch original
    const { data: original, error: fetchError } = await supabase
      .from("setlists")
      .select("*")
      .eq("id", setListId)
      .eq("church_id", churchId)
      .single();

    if (fetchError || !original) return;

    // Create duplicate
    const { data: newRow, error: insertError } = await supabase
      .from("setlists")
      .insert({
        church_id: churchId,
        title: `${original.title}_Copy`,
        date_string: original.date_string ?? null,
        time_string: original.time_string ?? null,
        service_type: original.service_type ?? null,
        service_notes: original.service_notes ?? "",
        created_by: "system",
        sections: original.sections ?? [],
      })
      .select("id")
      .single();

    if (insertError || !newRow) throw insertError ?? new Error("Insert failed");

    router.push(`/church/${churchId}/music/setlists/${newRow.id}`);
  } catch (err) {
    console.error("Duplicate error:", err);
  }
}
