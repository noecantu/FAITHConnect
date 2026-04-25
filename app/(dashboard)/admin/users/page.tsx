import { adminDb } from "@/app/lib/supabase/admin";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const { data: users } = await adminDb
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  const normalized = (users ?? []).map((u) => ({
    uid: u.id,
    ...u,
  }));

  return <UsersClient users={normalized} />;
}
