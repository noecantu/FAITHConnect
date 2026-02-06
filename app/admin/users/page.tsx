import { adminDb } from "@/lib/firebase/firebaseAdmin";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  // Load users
  const usersSnap = await adminDb
    .collection("users")
    .orderBy("createdAt", "desc")
    .get();

  const users = usersSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Load churches
  const churchesSnap = await adminDb.collection("churches").get();
  const churches = churchesSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return <UsersClient users={users} churches={churches} />;
}
