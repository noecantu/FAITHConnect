import { adminDb } from "@/lib/firebase/firebaseAdmin";
import UsersClient from "./UsersClient";

function normalizeUser(doc: { data: () => any; id: any; }) {
  const data = doc.data();

  return {
    id: doc.id,
    email: data.email ?? "",
    firstName: data.firstName ?? null,
    lastName: data.lastName ?? null,
    churchId: data.churchId ?? null,
    roles: data.roles ?? [],

    createdAt: data.createdAt
      ? data.createdAt.toDate().toISOString()
      : null,

    updatedAt: data.updatedAt
      ? data.updatedAt.toDate().toISOString()
      : null,
  };
}

function normalizeChurch(doc: { data: () => any; id: any; }) {
  const data = doc.data();

  return {
    id: doc.id,
    name: data.name ?? "",
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
