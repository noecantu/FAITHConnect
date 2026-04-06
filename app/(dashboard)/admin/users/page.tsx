import { adminDb } from "@/app/lib/firebase/admin";
import UsersClient from "./UsersClient";
import { normalizeFirestore } from "@/app/lib/normalize";
import type { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";

function normalizeUser(doc: QueryDocumentSnapshot<DocumentData>) {
  return {
    id: doc.id,
    ...normalizeFirestore(doc.data()),
  };
}

export default async function UsersPage() {
  const usersSnap = await adminDb
    .collection("users")
    .orderBy("createdAt", "desc")
    .get();

  const users = usersSnap.docs.map(normalizeUser);

  return <UsersClient users={users} />;
}
