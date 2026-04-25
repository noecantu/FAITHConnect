"use server";

import { adminDb } from "@/app/lib/supabase/admin";

export async function getChurchUsers(church_id: string) {
  const { data, error } = await adminDb
    .from("users")
    .select("*")
    .eq("church_id", church_id);

  if (error) throw error;

  return (data ?? []).map((u) => ({
    uid: u.id,
    first_name: u.first_name ?? "",
    last_name: u.last_name ?? "",
    displayName: u.display_name ?? "",
    email: u.email ?? "",
    roles: u.roles ?? [],
    church_id: u.church_id ?? null,
    created_at: u.created_at ? new Date(u.created_at).getTime() : null,
    updated_at: u.updated_at ? new Date(u.updated_at).getTime() : null,
  }));
}
