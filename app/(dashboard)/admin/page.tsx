// app/admin/page.tsx
import { adminDb } from "@/app/lib/firebase/admin";
import AdminHomeClient from "./AdminHomeClient";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { can } from "@/app/lib/auth/permissions";

export default async function AdminHomePage() {
  // 1. Get the logged-in user
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 2. Only RootAdmin can access this page
  if (!can(user.roles ?? [], "system.manage")) {
    redirect(`/church/${user.churchId}/user`);
  }

  // 3. Now it's safe to run Firestore Admin queries
  const churchesSnap = await adminDb.collection("churches").count().get();
  const usersSnap = await adminDb.collection("users").count().get();

  const adminsSnap = await adminDb
    .collection("users")
    .where("roles", "array-contains", "Admin")
    .count()
    .get();

  const eventsSnap = await adminDb.collectionGroup("events").count().get();
  const checkinsSnap = await adminDb.collectionGroup("checkins").count().get();
  const musicItemsSnap = await adminDb.collectionGroup("songs").count().get();
  const setlistsSnap = await adminDb.collectionGroup("setlists").count().get();

  const churchesLeaderDataSnap = await adminDb
    .collection("churches")
    .select("leaderName", "leaderTitle")
    .get();

  const churchLeaderCount = churchesLeaderDataSnap.docs.reduce((count, docSnap) => {
    const data = docSnap.data() as { leaderName?: unknown; leaderTitle?: unknown };
    const hasLeaderName = typeof data.leaderName === "string" && data.leaderName.trim().length > 0;
    const hasLeaderTitle = typeof data.leaderTitle === "string" && data.leaderTitle.trim().length > 0;

    return hasLeaderName || hasLeaderTitle ? count + 1 : count;
  }, 0);

  const financeSnap = await adminDb
    .collection("users")
    .where("roles", "array-contains", "Finance")
    .count()
    .get();

  return (
    <AdminHomeClient
      churchCount={churchesSnap.data().count ?? 0}
      userCount={usersSnap.data().count ?? 0}
      adminCount={adminsSnap.data().count ?? 0}
      eventCount={eventsSnap.data().count ?? 0}
      checkinCount={checkinsSnap.data().count ?? 0}
      musicItemCount={musicItemsSnap.data().count ?? 0}
      setlistCount={setlistsSnap.data().count ?? 0}
      churchLeaderCount={churchLeaderCount}
      financeCount={financeSnap.data().count ?? 0}
    />
  );
}