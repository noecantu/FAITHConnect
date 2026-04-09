//app/(dashboard)/admin/settings/integrityActions.ts
"use server";

import { adminDb } from "@/app/lib/firebase/admin";
import { SystemUser } from "@/app/lib/types";

export async function scanForStrayUsers() {
  const usersSnap = await adminDb.collection("users").select("roles", "churchId").get();
  const churchesSnap = await adminDb.collection("churches").get();

  const churchIds = new Set(churchesSnap.docs.map(d => d.id));

  const stray = usersSnap.docs
    .filter(u => {
      const data = u.data();
      return !data.churchId || !churchIds.has(data.churchId);
    })
    .map(u => ({ id: u.id, ...u.data() }));

  return stray;
}

export async function scanForOrphanedMembers() {
  const churchesSnap = await adminDb.collection("churches").get();

  const orphaned: any[] = [];

  for (const church of churchesSnap.docs) {
    const membersSnap = await church.ref.collection("members").get();

    membersSnap.docs.forEach(m => {
      const data = m.data();
      if (!data.userId) {
        orphaned.push({
          churchId: church.id,
          memberId: m.id,
          ...data
        });
      }
    });
  }

  return orphaned;
}

export async function scanForChurchesWithoutAdmins() {
  const churchesSnap = await adminDb.collection("churches").get();
  const usersSnap = await adminDb.collection("users").select("roles", "churchId").get();

  const users = usersSnap.docs.map(d => {
    return { id: d.id, ...(d.data() as any) } as SystemUser;
  });

  const result = churchesSnap.docs
    .filter(church => {
      const churchId = church.id;
      const admins = users.filter(
        u => u.churchId === churchId && u.roles?.includes("Admin")
      );
      return admins.length === 0;
    })
    .map(church => ({ id: church.id, ...church.data() }));

  return result;
}

export async function scanForInvalidRoles() {
  const VALID_ROLES = [
    "Admin",
    "Finance",
    "Music",
    "Usher",
    "MensGroup",
    "WomensGroup",
    "YouthGroup",
    "MusicManager",
    "UsherManager",
    "MensGroupManager",
    "WomensGroupManager",
    "YouthGroupManager",
    "RootAdmin"
  ];

  const usersSnap = await adminDb.collection("users").select("roles").get();

  const invalid = usersSnap.docs
    .filter(u => {
      const roles = u.data().roles || [];
      return roles.some((r: string) => !VALID_ROLES.includes(r));
    })
    .map(u => ({ id: u.id, ...u.data() }));

  return invalid;
}
