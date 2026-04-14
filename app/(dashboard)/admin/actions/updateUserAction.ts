"use server";

import { adminDb } from "@/app/lib/firebase/admin";
import admin from "firebase-admin";
import { logSystemEvent } from "@/app/lib/system/logging";
import { Role, SystemRole, ALL_ROLES, SYSTEM_ROLE_LIST } from "@/app/lib/auth/roles";
import { can } from "@/app/lib/auth/permissions";

export interface UpdateUserInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: Role[] | SystemRole[];
  churchId?: string | null;
  regionName?: string | null;
  regionId?: string | null;
  actorUid: string;
  actorName?: string | null;
}

export async function updateUserAction(input: UpdateUserInput) {
  const { userId, actorUid, actorName, roles: newRoles, ...updates } = input;

  const userRef = adminDb.collection("users").doc(userId);
  const actorRef = adminDb.collection("users").doc(actorUid);

  const [targetSnap, actorSnap] = await Promise.all([
    userRef.get(),
    actorRef.get(),
  ]);

  if (!targetSnap.exists) throw new Error("User not found");
  if (!actorSnap.exists) throw new Error("Actor not found");

  const before = targetSnap.data() || {};
  const actor = actorSnap.data() || {};

  const actorRoles = (actor.roles ?? []) as Role[];
  const isSelf = actorUid === userId;

  const isRootAdmin = can(actorRoles, "system.manage");
  const canAssignRoles = can(actorRoles, "roles.assign");

  // ---------------------------------------
  // 0. Validate roles (system vs church)
  // ---------------------------------------
  let isSystemRoleUpdate = false;
  let isChurchRoleUpdate = false;

  if (newRoles) {
    isSystemRoleUpdate = newRoles.every((r) =>
      SYSTEM_ROLE_LIST.includes(r as Role)
    );

    isChurchRoleUpdate = newRoles.every((r) =>
      ALL_ROLES.includes(r as Role) && !SYSTEM_ROLE_LIST.includes(r as Role)
    );

    if (!isSystemRoleUpdate && !isChurchRoleUpdate) {
      throw new Error("Invalid role assignment.");
    }
  }

  // ---------------------------------------
  // 1. Prevent cross-church modification
  // ---------------------------------------
  if (!isRootAdmin && actor.churchId !== before.churchId) {
    throw new Error("You cannot modify users from another church.");
  }

  // ---------------------------------------
  // 2. Only users with roles.assign can assign roles
  // ---------------------------------------
  if (newRoles && !canAssignRoles) {
    throw new Error("You do not have permission to assign roles.");
  }

  // ---------------------------------------
  // 3. Only RootAdmin can assign RootAdmin
  // ---------------------------------------
  if (newRoles?.includes("RootAdmin") && !isRootAdmin) {
    throw new Error("Only RootAdmin can assign the RootAdmin role.");
  }

  // ---------------------------------------
  // 4 & 5. Admin logic applies ONLY to church users
  // ---------------------------------------
  if (newRoles && isChurchRoleUpdate) {
    const churchRoles = newRoles as Role[];

    const targetIsAdmin = before.roles?.includes("Admin");
    const removingAdmin =
      targetIsAdmin && !churchRoles.includes("Admin");

    if (isSelf && removingAdmin && !isRootAdmin) {
      throw new Error("You cannot remove your own Admin role.");
    }

    if (removingAdmin && !isRootAdmin) {
      const adminsSnap = await adminDb
        .collection("users")
        .where("churchId", "==", before.churchId)
        .where("roles", "array-contains", "Admin")
        .get();

      const admins = adminsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const otherAdmins = admins.filter((a) => a.id !== userId);
      const isLastAdmin = otherAdmins.length === 0;

      if (isLastAdmin) {
        throw new Error("You cannot remove the last Admin from this church.");
      }
    }
  }

  // ⭐ Regional Admin region assignment (FIXED CONDITION)
  const hasRegionalAdmin = newRoles?.includes("RegionalAdmin");

  if (newRoles && hasRegionalAdmin) {
    const existingClaims = (await admin.auth().getUser(userId)).customClaims || {};
    const existingRoles = existingClaims.roles || [];

    await admin.auth().setCustomUserClaims(userId, {
      ...existingClaims,
      roles: Array.from(new Set([...existingRoles, "RegionalAdmin"]))
    });

    const regionName = input.regionName?.trim();

    if (!regionName) {
      throw new Error("Region name required for Regional Admin.");
    }

    const regionSnap = await adminDb
      .collection("regions")
      .where("name", "==", regionName)
      .limit(1)
      .get();

    let regionId: string;

    if (!regionSnap.empty) {
      const regionDoc = regionSnap.docs[0];
      regionId = regionDoc.id;

      await adminDb.collection("regions").doc(regionId).update({
        regionAdminId: userId,
        regionAdminName: `${before.firstName ?? ""} ${before.lastName ?? ""}`.trim(),
        churchIds: regionDoc.data().churchIds ?? [],
      });
    } else {
      const newRegion = await adminDb.collection("regions").add({
        name: regionName,
        regionAdminId: userId,
        regionAdminName: `${before.firstName ?? ""} ${before.lastName ?? ""}`.trim(),
        churchIds: [],
        createdBy: actorUid,
        createdByName: actorName ?? null,
        createdAt: Date.now(),
      });

      regionId = newRegion.id;
    }

    updates.regionId = regionId;
  }

  // Clear regionId if no longer RegionalAdmin
  if (newRoles && !newRoles.includes("RegionalAdmin")) {
    updates.regionId = null;
  }

  // ---------------------------------------
  // 6. Apply updates
  // ---------------------------------------
  const finalUpdates = {
    ...updates,
    ...(newRoles ? { roles: newRoles } : {}),
  };

  await userRef.update(finalUpdates);

  // ---------------------------------------
  // 7. Log the event
  // ---------------------------------------
  await logSystemEvent({
    type: "USER_UPDATED",
    actorUid,
    actorName,
    targetId: userId,
    targetType: "USER",
    message: `Updated user: ${before.email ?? "Unknown"}`,
    before,
    after: { ...before, ...finalUpdates },
  });

  return { success: true };
}