import { getSupabaseClient } from "@/app/lib/supabase/client";

export async function deleteAttendanceDay(churchId: string, dateString: string) {
  const { error } = await getSupabaseClient()
    .from("attendance")
    .delete()
    .eq("church_id", churchId)
    .eq("date_string", dateString);

  if (error) throw error;
}
