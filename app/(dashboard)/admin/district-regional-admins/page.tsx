import { adminDb } from "@/app/lib/supabase/admin";
import DistrictRegionalAdminsClient from "./DistrictRegionalAdminsClient";

export const dynamic = "force-dynamic";

export default async function DistrictRegionalAdminsPage() {
  const { data: users } = await adminDb
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  const normalized = (users ?? []).map((u) => ({
    uid: u.id,
    email: u.email,
    firstName: u.first_name,
    lastName: u.last_name,
    roles: u.roles ?? [],
    churchId: u.church_id,
    createdAt: u.created_at,
  }));

  return <DistrictRegionalAdminsClient users={normalized} />;
}
