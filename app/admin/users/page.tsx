import { adminDb } from "@/lib/firebase/firebaseAdmin";
import UsersClient from "./UsersClient";
import { normalizeFirestore } from "@/lib/normalize";

function normalizeUser(doc: { data: () => any; id: any }) {
  return {
    id: doc.id,
    ...normalizeFirestore(doc.data()),
  };
}

function normalizeChurch(doc: { data: () => any; id: any }) {
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

  const churchesSnap = await adminDb.collection("churches").get();
  const churches = churchesSnap.docs.map(normalizeChurch);

  return <UsersClient users={users} churches={churches} />;
}
