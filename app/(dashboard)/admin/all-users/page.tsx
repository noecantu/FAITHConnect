import { redirect } from "next/navigation";

import { adminDb } from "@/app/lib/firebase/admin";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { normalizeFirestore } from "@/app/lib/normalize";
import { SYSTEM_ROLE_LIST, type Role } from "@/app/lib/auth/roles";
import AllUsersClient, { type NonSystemUserRecord } from "./AllUsersClient";

export default async function AllUsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (!currentUser.roles?.includes("RootAdmin")) {
    redirect("/admin");
  }

  const [usersSnap, churchesSnap] = await Promise.all([
    adminDb.collection("users").orderBy("createdAt", "desc").get(),
    adminDb.collection("churches").select("name").get(),
  ]);

  const churchNameById = new Map<string, string>();
  for (const churchDoc of churchesSnap.docs) {
    const church = churchDoc.data() as { name?: unknown };
    const name = typeof church.name === "string" && church.name.trim().length > 0
      ? church.name
      : churchDoc.id;

    churchNameById.set(churchDoc.id, name);
  }

  const users: NonSystemUserRecord[] = usersSnap.docs
    .map((doc) => {
      const normalized = normalizeFirestore(doc.data()) as {
        email?: string;
        firstName?: string | null;
        lastName?: string | null;
        roles?: Role[];
        churchId?: string | null;
        createdAt?: string | number | Date | null;
      };

      const roles = Array.isArray(normalized.roles) ? normalized.roles : [];

      return {
        uid: doc.id,
        email: normalized.email ?? "",
        firstName: normalized.firstName ?? null,
        lastName: normalized.lastName ?? null,
        roles,
        churchId: normalized.churchId ?? null,
        churchName:
          normalized.churchId && churchNameById.has(normalized.churchId)
            ? churchNameById.get(normalized.churchId) ?? null
            : null,
        createdAt: normalized.createdAt ?? null,
      };
    })
    .filter((user) => !user.roles.some((role) => SYSTEM_ROLE_LIST.includes(role)));

  return <AllUsersClient users={users} />;
}