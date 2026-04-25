// This is a compatibility shim that wraps the new Supabase-based getServerUser
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import type { AppUser } from "@/app/lib/types";
import type { Role } from "@/app/lib/auth/roles";

export async function getCurrentUser(): Promise<AppUser | null> {
  const user = await getServerUser();
  if (!user) return null;

  const { data } = await adminDb
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!data) return null;

  return {
    uid: data.id,
    email: data.email,
    firstName: data.first_name ?? null,
    lastName: data.last_name ?? null,
    profilePhotoUrl: data.profile_photo_url ?? null,
    churchId: data.church_id ?? null,
    regionId: data.region_id ?? null,
    districtId: data.district_id ?? null,
    roles: (data.roles ?? []) as Role[],
    settings: data.settings ?? {},
  };
}