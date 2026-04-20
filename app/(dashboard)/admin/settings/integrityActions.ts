// app/(dashboard)/admin/settings/integrityActions.ts
"use server";

import { adminDb } from "@/app/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { SystemUser } from "@/app/lib/types";
import { ALL_ROLES, CHURCH_ROLES, SYSTEM_ROLES } from "@/app/lib/auth/roles";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { can } from "@/app/lib/auth/permissions";
import { logSystemEvent } from "@/app/lib/system/logging";

/**
 * Recursively converts Firestore data into JSON‑serializable values.
 * - Firestore Timestamp → ISO string
 * - Nested objects/arrays handled safely
 */
function serializeFirestore(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  // Firestore Timestamp (has .toDate())
  if (typeof obj === "object" && typeof obj.toDate === "function") {
    return obj.toDate().toISOString();
  }

  // Array
  if (Array.isArray(obj)) {
    return obj.map(serializeFirestore);
  }

  // Plain object
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, serializeFirestore(v)])
    );
  }

  // Primitive
  return obj;
}

async function requireSystemManager() {
  const actor = await getCurrentUser();

  if (!actor || !can(actor.roles ?? [], "system.manage")) {
    throw new Error("Unauthorized");
  }

  return actor;
}

/* ---------------------------------------------------------
   SCAN: Users whose churchId is missing or references a non‑existent church
--------------------------------------------------------- */
export async function scanForStrayUsers() {
  await requireSystemManager();

  const usersSnap = await adminDb
    .collection("users")
    .select("roles", "churchId")
    .get();

  const churchesSnap = await adminDb.collection("churches").get();
  const churchIds = new Set(churchesSnap.docs.map(d => d.id));

  const stray = usersSnap.docs
    .filter(u => {
      const data = u.data();
      const roles: string[] = data.roles || [];

      // If user has ANY system role → they should NOT have a churchId → skip
      if (roles.some(r => SYSTEM_ROLES.includes(r as any))) {
        return false;
      }

      // If user has church roles → they MUST have a valid churchId
      const hasChurchRoles = roles.some(r => CHURCH_ROLES.includes(r as any));

      if (hasChurchRoles) {
        return !data.churchId || !churchIds.has(data.churchId);
      }

      // If user has no roles at all → they are stray
      return true;
    })
    .map(u => ({
      uid: u.id,
      ...serializeFirestore(u.data())
    }));

  return stray;
}


/* ---------------------------------------------------------
   SCAN: Members inside churches who have no userId
--------------------------------------------------------- */
export async function scanForOrphanedMembers() {
  await requireSystemManager();

  const churchesSnap = await adminDb.collection("churches").get();

  // Build a set of active church IDs
  const activeChurchIds = new Set(
    churchesSnap.docs
      .filter(c => {
        const data = c.data();
        return data.status === "Active" || data.active === true || !data.status;
      })
      .map(c => c.id)
  );

  const orphaned: any[] = [];

  for (const church of churchesSnap.docs) {
    const membersSnap = await church.ref.collection("members").get();

    membersSnap.docs.forEach(m => {
      const churchId = church.id;

      // If the church is NOT active, all its members are orphaned
      if (!activeChurchIds.has(churchId)) {
        orphaned.push({
          churchId,
          memberId: m.id,
          ...serializeFirestore(m.data())
        });
      }
    });
  }

  return orphaned;
}

/* ---------------------------------------------------------
   SCAN: Churches that have zero Admin users
--------------------------------------------------------- */
export async function scanForChurchesWithoutAdmins() {
  await requireSystemManager();

  const churchesSnap = await adminDb.collection("churches").get();
  const usersSnap = await adminDb
    .collection("users")
    .select("roles", "churchId")
    .get();

  const users = usersSnap.docs.map(d => ({
    uid: d.id,
    ...serializeFirestore(d.data())
  })) as SystemUser[];

  const result = churchesSnap.docs
    .filter(church => {
      const churchId = church.id;
      const admins = users.filter(
        u => u.churchId === churchId && u.roles?.includes("Admin")
      );
      return admins.length === 0;
    })
    .map(church => ({
      id: church.id,
      ...serializeFirestore(church.data())
    }));

  return result;
}

/* ---------------------------------------------------------
   SCAN: Users with invalid roles
--------------------------------------------------------- */
export async function scanForInvalidRoles() {
  await requireSystemManager();

  const usersSnap = await adminDb
    .collection("users")
    .select("roles")
    .get();

  const invalid = usersSnap.docs
    .filter(u => {
      const data = u.data();
      const roles: string[] = data.roles || [];

      // Any role not in ALL_ROLES is invalid
      return roles.some(role => !ALL_ROLES.includes(role as any));
    })
    .map(u => ({
      uid: u.id,
      ...serializeFirestore(u.data())
    }));

  return invalid;
}

export async function normalizeUserUids() {
  const actor = await requireSystemManager();

  const usersSnap = await adminDb.collection("users").get();

  let touched = 0;
  let addedUid = 0;
  let correctedUid = 0;
  let removedLegacyId = 0;
  const changedUsers: Array<{
    uid: string;
    previousUid: string | null;
    previousId: string | null;
  }> = [];

  let batch = adminDb.batch();
  let batchOps = 0;

  for (const docSnap of usersSnap.docs) {
    const data = docSnap.data();
    const nextUid = docSnap.id;
    const currentUid = typeof data.uid === "string" ? data.uid : null;
    const legacyId = typeof data.id === "string" ? data.id : null;

    const updatePayload: Record<string, unknown> = {};

    if (currentUid !== nextUid) {
      updatePayload.uid = nextUid;

      if (currentUid) {
        correctedUid += 1;
      } else {
        addedUid += 1;
      }
    }

    if ("id" in data) {
      updatePayload.id = FieldValue.delete();
      removedLegacyId += 1;
    }

    if (Object.keys(updatePayload).length === 0) {
      continue;
    }

    batch.update(docSnap.ref, updatePayload);
    batchOps += 1;
    touched += 1;

    if (changedUsers.length < 25) {
      changedUsers.push({
        uid: nextUid,
        previousUid: currentUid,
        previousId: legacyId,
      });
    }

    if (batchOps === 400) {
      await batch.commit();
      batch = adminDb.batch();
      batchOps = 0;
    }
  }

  if (batchOps > 0) {
    await batch.commit();
  }

  await logSystemEvent({
    type: "SYSTEM_EVENT",
    actorUid: actor.uid,
    actorName: `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim() || actor.email,
    targetType: "SYSTEM",
    message: "Normalized users collection to uid-based identifiers.",
    metadata: {
      scanned: usersSnap.size,
      touched,
      addedUid,
      correctedUid,
      removedLegacyId,
    },
  });

  return {
    scanned: usersSnap.size,
    touched,
    addedUid,
    correctedUid,
    removedLegacyId,
    changedUsers,
  };
}

