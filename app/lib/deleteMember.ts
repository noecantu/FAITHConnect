"use client";

import { getSupabaseClient } from "@/app/lib/supabase/client";

export async function deleteMember(
  churchId: string,
  memberId: string,
  router: { push: (path: string) => void },
  toast: (opts: { title: string; description?: string; variant?: string }) => void
) {
  try {
    const supabase = getSupabaseClient();

    // 1. Delete member row (RLS or cascade handles related data)
    const { error } = await supabase
      .from("members")
      .delete()
      .eq("id", memberId)
      .eq("church_id", churchId);

    if (error) throw error;

    // 2. Delete Storage files (photo + QR) — ignore errors for missing files
    const photoPaths = [
      `churches/${churchId}/members/${memberId}/photo.jpg`,
      `churches/${churchId}/members/${memberId}/qr.png`,
    ];

    await Promise.allSettled(
      photoPaths.map((path) =>
        supabase.storage.from("member-photos").remove([path])
      )
    );

    // 3. Toast + redirect
    toast({
      title: "Member deleted",
      description: "The member has been removed.",
    });

    router.push(`/church/${churchId}/members`);
  } catch (error) {
    console.error("Error deleting member:", error);

    toast({
      title: "Error",
      description: "Failed to delete member.",
      variant: "destructive",
    });
  }
}
