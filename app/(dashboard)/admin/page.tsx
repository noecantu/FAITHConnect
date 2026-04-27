// app/admin/page.tsx
export const dynamic = "force-dynamic";

import { adminDb } from "@/app/lib/supabase/admin";
import AdminHomeClient from "./AdminHomeClient";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { can } from "@/app/lib/auth/permissions";

export default async function AdminHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!can(user.roles ?? [], "system.manage")) {
    const fallbackId = (user as unknown as Record<string, unknown>).church_id ?? user.churchId;
    if (fallbackId) {
      redirect(`/church/${fallbackId}/user`);
    } else {
      redirect("/login");
    }
  }

  const [
    { count: churchesCount },
    { count: districtsCount },
    { count: regionsCount },
    { count: usersCount },
    { count: eventsCount },
    { count: checkinsCount },
    { count: songsCount },
    { count: setlistsCount },
    { data: adminUsers },
    { data: financeUsers },
    { data: leaderChurches },
  ] = await Promise.all([
    adminDb.from("churches").select("id", { count: "exact", head: true }),
    adminDb.from("districts").select("id", { count: "exact", head: true }),
    adminDb.from("regions").select("id", { count: "exact", head: true }),
    adminDb.from("users").select("id", { count: "exact", head: true }),
    adminDb.from("events").select("id", { count: "exact", head: true }),
    adminDb.from("attendance").select("id", { count: "exact", head: true }),
    adminDb.from("songs").select("id", { count: "exact", head: true }),
    adminDb.from("setlists").select("id", { count: "exact", head: true }),
    adminDb.from("users").select("id").contains("roles", ["Admin"]),
    adminDb.from("users").select("id").contains("roles", ["Finance"]),
    adminDb.from("churches").select("id").not("leader_name", "is", null),
  ]);

  return (
    <AdminHomeClient
      churchCount={churchesCount ?? 0}
      districtCount={districtsCount ?? 0}
      regionCount={regionsCount ?? 0}
      userCount={usersCount ?? 0}
      adminCount={adminUsers?.length ?? 0}
      eventCount={eventsCount ?? 0}
      checkinCount={checkinsCount ?? 0}
      musicItemCount={songsCount ?? 0}
      setlistCount={setlistsCount ?? 0}
      churchLeaderCount={leaderChurches?.length ?? 0}
      financeCount={financeUsers?.length ?? 0}
    />
  );
}
