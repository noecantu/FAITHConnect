// app/admin/page.tsx
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import AdminHomeClient from "./AdminHomeClient";

export default async function AdminHomePage() {
  // Count churches
  const churchesSnap = await adminDb.collection("churches").count().get();
  const churchCount = churchesSnap.data().count ?? 0;

  // Count all users
  const usersSnap = await adminDb.collection("users").count().get();
  const userCount = usersSnap.data().count ?? 0;

  // Count admins (church admins)
  const adminsSnap = await adminDb
    .collection("users")
    .where("roles", "array-contains", "Admin")
    .count()
    .get();
  const adminCount = adminsSnap.data().count ?? 0;

  return (
    <AdminHomeClient
      churchCount={churchCount}
      userCount={userCount}
      adminCount={adminCount}
    />
  );
}
