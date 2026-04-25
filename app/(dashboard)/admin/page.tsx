// app/admin/page.tsx
import { adminDb } from "@/app/lib/supabase/admin";
import AdminHomeClient from "./AdminHomeClient";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { can } from "@/app/lib/auth/permissions";

export default async function AdminHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!can(user.roles ?? [], "system.manage")) {
    redirect(`/church/${user.church_id}/user`);
  }

  const [
    { count: churchesCount },
    { count: districtsCount },
    { count: regionsCount },
    { count: usersCount },
  ] = await Promise.all([
    adminDb.from("churches").select("id", { count: "exact", head: true }),
    adminDb.from("districts").select("id", { count: "exact", head: true }),
    adminDb.from("regions").select("id", { count: "exact", head: true }),
    adminDb.from("users").select("id", { count: "exact", head: true }),
  ]);

  return (
    <AdminHomeClient
      churches={churchesCount ?? 0}
      districts={districtsCount ?? 0}
      regions={regionsCount ?? 0}
      users={usersCount ?? 0}
    />
  );
}
