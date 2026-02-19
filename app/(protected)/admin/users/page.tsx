import { adminDb } from "@/lib/firebase/firebaseAdmin";
import UsersClient from "./UsersClient";
import { normalizeFirestore } from "@/lib/normalize";
import type { QueryDocumentSnapshot, DocumentData } from "firebase-admin/firestore";

function normalizeUser(doc: QueryDocumentSnapshot<DocumentData>) {
  return {
    id: doc.id,
    ...normalizeFirestore(doc.data()),
  };
}

// function normalizeChurch(doc: QueryDocumentSnapshot<DocumentData>) {
//   return {
//     id: doc.id,
//     ...normalizeFirestore(doc.data()),
//   };
// }

export default async function UsersPage() {
  const usersSnap = await adminDb
    .collection("users")
    .orderBy("createdAt", "desc")
    .get();

  const users = usersSnap.docs.map(normalizeUser);

  // const churchesSnap = await adminDb.collection("churches").get();
  // const churches = churchesSnap.docs.map(normalizeChurch);

  return <UsersClient users={users} />;
}
