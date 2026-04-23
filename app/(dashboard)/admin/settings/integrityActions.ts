// app/(dashboard)/admin/settings/integrityActions.ts
"use server";

import { adminDb } from "@/app/lib/firebase/admin";
import { adminAuth } from "@/app/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { DocumentReference } from "firebase-admin/firestore";
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

function isChurchActiveForIntegrity(data: Record<string, unknown>): boolean {
  const rawStatus = typeof data.status === "string" ? data.status.trim().toLowerCase() : "";
  const explicitInactive = new Set(["disabled", "inactive", "archived", "suspended"]);

  if (typeof data.active === "boolean") {
    if (data.active === true) return true;
    if (data.active === false) return false;
  }

  if (!rawStatus) return true;
  if (explicitInactive.has(rawStatus)) return false;

  return true;
}

async function requireSystemManager() {
  const actor = await getCurrentUser();

  if (!actor || !can(actor.roles ?? [], "system.manage")) {
    throw new Error("Unauthorized");
  }

  return actor;
}

async function deleteDocumentTree(ref: DocumentReference) {
  const subcollections = await ref.listCollections();

  for (const subcollection of subcollections) {
    const childRefs = await subcollection.listDocuments();

    for (const childRef of childRefs) {
      await deleteDocumentTree(childRef);
    }
  }

  await ref.delete();
}

/* ---------------------------------------------------------
   SCAN: Users whose churchId is missing or references a non‑existent church
--------------------------------------------------------- */
export async function scanForStrayUsers() {
  await requireSystemManager();

  const usersSnap = await adminDb
    .collection("users")
    .select("roles", "churchId", "email", "firstName", "lastName")
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

export async function deleteStrayUser(uid: string) {
  const actor = await requireSystemManager();

  if (!uid || typeof uid !== "string") {
    throw new Error("Missing uid.");
  }

  if (actor.uid === uid) {
    throw new Error("You cannot delete your own account.");
  }

  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error("User not found.");
  }

  const userData = userSnap.data() as { churchId?: unknown };
  const targetChurchId =
    typeof userData.churchId === "string" ? userData.churchId : null;

  if (targetChurchId) {
    const churchSnap = await adminDb.collection("churches").doc(targetChurchId).get();
    if (churchSnap.exists) {
      const church = churchSnap.data() as {
        billingOwnerUid?: unknown;
        createdBy?: unknown;
      };

      const billingOwnerUid =
        typeof church.billingOwnerUid === "string"
          ? church.billingOwnerUid
          : typeof church.createdBy === "string"
          ? church.createdBy
          : null;

      if (billingOwnerUid === uid) {
        throw new Error(
          "This user is the billing owner for this church. Reassign billing ownership before deleting this account."
        );
      }
    }
  }

  try {
    await adminAuth.deleteUser(uid);
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    if (code !== "auth/user-not-found") {
      throw error;
    }
  }

  await deleteDocumentTree(userRef);

  return { success: true, uid };
}


/* ---------------------------------------------------------
  SCAN: Members in inactive churches OR with dangling user links
--------------------------------------------------------- */
export async function scanForOrphanedMembers() {
  await requireSystemManager();

  const churchesSnap = await adminDb.collection("churches").get();
  const usersSnap = await adminDb.collection("users").select().get();
  const userIds = new Set(usersSnap.docs.map((docSnap) => docSnap.id));

  // Build a set of active church IDs
  const activeChurchIds = new Set(
    churchesSnap.docs
      .filter((c) => isChurchActiveForIntegrity(c.data() as Record<string, unknown>))
      .map((c) => c.id)
  );

  const orphaned: any[] = [];

  for (const church of churchesSnap.docs) {
    const churchData = church.data() as { name?: unknown };
    const churchName =
      typeof churchData.name === "string" && churchData.name.trim().length > 0
        ? churchData.name
        : church.id;

    const membersSnap = await church.ref.collection("members").get();

    membersSnap.docs.forEach(m => {
      const churchId = church.id;
      const memberData = m.data() as {
        firstName?: unknown;
        lastName?: unknown;
        userId?: unknown;
      };

      const firstName = typeof memberData.firstName === "string" ? memberData.firstName : "";
      const lastName = typeof memberData.lastName === "string" ? memberData.lastName : "";
      const memberName = `${firstName} ${lastName}`.trim() || "Unnamed member";
      const linkedUserId = typeof memberData.userId === "string" ? memberData.userId : null;

      let reason: "inactive-church" | "dangling-user-link" | null = null;

      // If the church is NOT active, all its members are orphaned
      if (!activeChurchIds.has(churchId)) {
        reason = "inactive-church";
      } else if (linkedUserId && !userIds.has(linkedUserId)) {
        reason = "dangling-user-link";
      }

      if (reason) {
        orphaned.push({
          churchId,
          churchName,
          memberId: m.id,
          memberName,
          linkedUserId,
          reason,
          ...serializeFirestore(memberData),
        });
      }
    });
  }

  return orphaned;
}

export async function deleteOrphanedMember(churchId: string, memberId: string) {
  await requireSystemManager();

  if (!churchId || typeof churchId !== "string") {
    throw new Error("Missing churchId.");
  }

  if (!memberId || typeof memberId !== "string") {
    throw new Error("Missing memberId.");
  }

  const memberRef = adminDb
    .collection("churches")
    .doc(churchId)
    .collection("members")
    .doc(memberId);

  const memberSnap = await memberRef.get();
  if (!memberSnap.exists) {
    throw new Error("Member not found.");
  }

  await memberRef.delete();

  return { success: true, churchId, memberId };
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
      ...serializeFirestore(u.data()),
      invalidRoles: ((u.data().roles || []) as string[]).filter(
        role => !ALL_ROLES.includes(role as any)
      ),
      validRoles: ((u.data().roles || []) as string[]).filter(
        role => ALL_ROLES.includes(role as any)
      ),
    }));

  return invalid;
}

export async function repairInvalidUserRoles(uid: string) {
  await requireSystemManager();

  if (!uid || typeof uid !== "string") {
    throw new Error("Missing uid.");
  }

  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error("User not found.");
  }

  const data = userSnap.data() as { roles?: unknown };
  const roles = Array.isArray(data.roles) ? data.roles : [];

  const filteredRoles = Array.from(
    new Set(
      roles
        .filter((role): role is string => typeof role === "string")
        .filter((role) => ALL_ROLES.includes(role as any))
    )
  );

  await userRef.update({ roles: filteredRoles });

  return { success: true, uid, roles: filteredRoles };
}

async function listAllAuthUsers() {
  const users: Array<{
    uid: string;
    email?: string | null;
    disabled?: boolean;
    providerIds: string[];
    creationTime?: string | null;
    lastSignInTime?: string | null;
  }> = [];

  let nextPageToken: string | undefined;

  do {
    const page = await adminAuth.listUsers(1000, nextPageToken);

    page.users.forEach((u) => {
      users.push({
        uid: u.uid,
        email: u.email ?? null,
        disabled: u.disabled,
        providerIds: u.providerData.map((p) => p.providerId),
        creationTime: u.metadata.creationTime ?? null,
        lastSignInTime: u.metadata.lastSignInTime ?? null,
      });
    });

    nextPageToken = page.pageToken;
  } while (nextPageToken);

  return users;
}

export async function scanForStrayAuthUsers() {
  await requireSystemManager();

  const authUsers = await listAllAuthUsers();
  const firestoreUsersSnap = await adminDb.collection("users").select().get();
  const firestoreUserIds = new Set(firestoreUsersSnap.docs.map((docSnap) => docSnap.id));

  return authUsers
    .filter((authUser) => !firestoreUserIds.has(authUser.uid))
    .sort((a, b) => {
      const aTime = a.creationTime ? new Date(a.creationTime).getTime() : 0;
      const bTime = b.creationTime ? new Date(b.creationTime).getTime() : 0;
      return bTime - aTime;
    });
}

export async function deleteStrayAuthUser(uid: string) {
  const actor = await requireSystemManager();

  if (!uid || typeof uid !== "string") {
    throw new Error("Missing uid.");
  }

  if (actor.uid === uid) {
    throw new Error("You cannot delete your own auth account.");
  }

  const firestoreUserSnap = await adminDb.collection("users").doc(uid).get();
  if (firestoreUserSnap.exists) {
    throw new Error("This uid has a Firestore user profile. Use standard user deletion instead.");
  }

  await adminAuth.deleteUser(uid);

  return { success: true, uid };
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

