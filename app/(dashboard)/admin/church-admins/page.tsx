import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

import { adminDb } from "@/app/lib/supabase/admin";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { NON_CHURCH_ROLE_LIST, type Role } from "@/app/lib/auth/roles";
import AllUsersClient, { type NonSystemUserRecord } from "../all-users/AllUsersClient";

export default async function ChurchAdminsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/login");
  if (!currentUser.roles?.includes("RootAdmin")) redirect("/admin");

  const [{ data: usersData }, { data: churchesData }] = await Promise.all([
    adminDb.from("users").select("*").order("created_at", { ascending: false }),
    adminDb.from("churches").select("id, name"),
  ]);

  const churchNameById = new Map<string, string>();
  for (const church of churchesData ?? []) {
    churchNameById.set(church.id, church.name ?? church.id);
  }

  const churchAdmins: NonSystemUserRecord[] = (usersData ?? [])
    .filter((u) => {
      const roles = (u.roles ?? []) as Role[];
      return (
        !roles.some((r) => NON_CHURCH_ROLE_LIST.includes(r)) &&
        roles.includes("Admin")
      );
    })
    .map((u) => ({
      uid: u.id,
      email: u.email ?? "",
      firstName: u.first_name ?? "",
      lastName: u.last_name ?? "",
      roles: (u.roles ?? []) as Role[],
      churchId: u.church_id ?? null,
      churchName: u.church_id ? (churchNameById.get(u.church_id) ?? null) : null,
      createdAt: u.created_at ?? null,
    }));

  return (
    <AllUsersClient
      users={churchAdmins}
      title="Church Admins"
      subtitle="Root Admin management for all Church Administrator accounts."
      cardTitle="Church Administrators"
    />
  );
}
