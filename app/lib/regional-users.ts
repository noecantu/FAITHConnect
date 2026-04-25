import { getSupabaseClient } from "@/app/lib/supabase/client";

type RegionalUserRecord = {
  uid: string;
  roles?: string[];
  churchId?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePhotoUrl?: string | null;
};

export async function getUsersByChurchIds(churchIds: string[]): Promise<RegionalUserRecord[]> {
  const normalizedChurchIds = Array.from(new Set(churchIds.filter(Boolean)));

  if (normalizedChurchIds.length === 0) return [];

  const { data, error } = await getSupabaseClient()
    .from("users")
    .select("id, roles, church_id, first_name, last_name, email, profile_photo_url")
    .in("church_id", normalizedChurchIds);

  if (error) throw error;

  const users = new Map<string, RegionalUserRecord>();

  (data ?? []).forEach((row) => {
    users.set(row.id, {
      uid: row.id,
      roles: row.roles,
      churchId: row.church_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      profilePhotoUrl: row.profile_photo_url,
    });
  });

  return Array.from(users.values());
}
