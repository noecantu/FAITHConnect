// app/admin/page.tsx
import { adminDb } from "@/lib/firebase/firebaseAdmin";
import AdminHomeClient from "./AdminHomeClient";

export default async function AdminHomePage() {
  const churches = await adminDb.collection("churches").count().get();
  const users = await adminDb.collection("users").count().get();
  const admins = await adminDb
    .collection("users")
    .where("roles", "array-contains", "Admin")
    .count()
    .get();

  return (
    <AdminHomeClient
      churchCount={churches.data().count}
      userCount={users.data().count}
      adminCount={admins.data().count}
    />
  );
}
