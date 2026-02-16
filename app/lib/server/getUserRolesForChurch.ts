import { adminDb } from "@/lib/firebase/firebaseAdmin";

export async function getUserRolesForChurch(
  uid: string,
  churchId: string
): Promise<string[]> {
  // 1. Global user roles
  const userDoc = await adminDb.collection("users").doc(uid).get();
  const userData = userDoc.exists ? userDoc.data() : null;
  const globalRoles: string[] = Array.isArray(userData?.roles)
    ? userData.roles
    : [];

  // 2. Church-specific roles
  const membersRef = adminDb
    .collection("churches")
    .doc(churchId)
    .collection("members");

  const memberQuery = await membersRef.where("userId", "==", uid).get();

  let churchRoles: string[] = [];
  if (!memberQuery.empty) {
    const memberData = memberQuery.docs[0].data();
    if (Array.isArray(memberData.roles)) {
      churchRoles = memberData.roles;
    }
  }

  // Combine and dedupe
  return Array.from(new Set([...globalRoles, ...churchRoles]));
}
