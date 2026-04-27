import { adminDb } from "@/app/lib/supabase/admin";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
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

  return <UsersClient users={normalized} />;
}
