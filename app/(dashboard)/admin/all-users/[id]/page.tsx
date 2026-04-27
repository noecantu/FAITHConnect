export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { adminDb } from "@/app/lib/supabase/admin";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { SYSTEM_ROLE_LIST, type Role } from "@/app/lib/auth/roles";
import EditAllUserForm, { type EditableNonSystemUser } from "./EditAllUserForm";

export default async function AllUserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/login");
  if (!currentUser.roles?.includes("RootAdmin")) redirect("/admin");

  const { id: userId } = await params;

  const [{ data: userData }, { data: churchesData }] = await Promise.all([
    adminDb.from("users").select("*").eq("id", userId).single(),
    adminDb.from("churches").select("id, name"),
  ]);

  if (!userData) {
    return <div className="p-6">User not found.</div>;
  }

  const roles = (userData.roles ?? []) as Role[];
  const isSystemUser = roles.some((r) => SYSTEM_ROLE_LIST.includes(r));

  if (isSystemUser) redirect("/admin/users");

  const churchOptions = (churchesData ?? []).map((c) => ({
    id: c.id,
    name: c.name ?? c.id,
  }));

  const user: EditableNonSystemUser = {
    uid: userData.id,
    email: userData.email ?? "",
    firstName: userData.first_name ?? "",
    lastName: userData.last_name ?? "",
    roles,
    churchId: userData.church_id ?? null,
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Edit User</h1>
      <EditAllUserForm user={user} churches={churchOptions} />
    </div>
  );
}
