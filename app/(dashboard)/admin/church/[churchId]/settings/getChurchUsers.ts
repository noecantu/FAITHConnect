"use server";

import { adminDb } from "@/app/lib/firebase/admin";

export async function getChurchUsers(churchId: string) {
  const snap = await adminDb
    .collection("users")
    .where("churchId", "==", churchId)
    .get();

  return snap.docs.map((d) => {
    const data = d.data();

    return {
      uid: d.id,
      firstName: data.firstName ?? "",
      lastName: data.lastName ?? "",
      displayName: data.displayName ?? "",
      email: data.email ?? "",
      roles: data.roles ?? [],
      churchId: data.churchId ?? null,

      // Convert Firestore timestamps → numbers
      createdAt: data.createdAt ? data.createdAt.toMillis() : null,
      updatedAt: data.updatedAt ? data.updatedAt.toMillis() : null,
    };
  });
}
