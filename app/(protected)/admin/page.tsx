// app/admin/page.tsx
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import AdminHomeClient from "./AdminHomeClient";

export default async function AdminHomePage() {
  // --- Core Collections ---
  const churchesSnap = await adminDb.collection("churches").count().get();
  const usersSnap = await adminDb.collection("users").count().get();

  // --- Church Admins ---
  const adminsSnap = await adminDb
    .collection("users")
    .where("roles", "array-contains", "Admin")
    .count()
    .get();

  // --- Events ---
  const eventsSnap = await adminDb.collectionGroup("events").count().get();

  // --- Check-ins ---
  const checkinsSnap = await adminDb.collectionGroup("checkins").count().get();

  // --- Music Items ---
  const musicItemsSnap = await adminDb.collectionGroup("songs").count().get();

  // --- Setlists ---
  const setlistsSnap = await adminDb.collectionGroup("setlists").count().get();

  // --- Pastors ---
  const pastorsSnap = await adminDb
    .collection("users")
    .where("roles", "array-contains", "Pastor")
    .count()
    .get();

  // --- Finance Managers ---
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
      pastorCount={pastorsSnap.data().count ?? 0}
      financeCount={financeSnap.data().count ?? 0}
    />
  );
}
