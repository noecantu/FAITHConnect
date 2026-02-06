"use server";

import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { logSystemEvent } from "@/lib/system/logging";

// Roles that ONLY Master Admin can assign
const MASTER_ONLY_ROLES = ["RootAdmin", "SystemAdmin"];

// Roles that Church Admin is allowed to assign
const CHURCH_ADMIN_ALLOWED_ROLES = ["Admin", "Member", "Viewer"];

export interface UpdateUserRolesInput {
  userId: string;
  newRoles: string[];

  actorUid: string;
  actorName?: string | null;
  actorRoles: string[];     // roles of the person making the change
  actorChurchId?: string;   // needed for Church Admin scope enforcement
}

export async function updateUserRolesAction(input: UpdateUserRolesInput) {
  const {
    userId,
    newRoles,
    actorUid,
    actorName,
    actorRoles,
    actorChurchId,
  } = input;

  // 1. Load target user
  const userRef = adminDb.collection("users").doc(userId);
  const snap = await userRef.get();

  if (!snap.exists) {
    throw new Error("User not found");
  }

  const before = snap.data() || {};
  const oldRoles = before.roles || [];

  // 2. Permission Enforcement
  const isMasterAdmin = actorRoles.includes("RootAdmin") || actorRoles.includes("SystemAdmin");
  const isChurchAdmin = actorRoles.includes("Admin");

  // Church Admin cannot modify users outside their church
  if (isChurchAdmin && before.churchId !== actorChurchId) {
    throw new Error("You do not have permission to modify users from another church.");
  }

  // Church Admin cannot assign master-level roles
  if (isChurchAdmin) {
    for (const role of newRoles) {
      if (!CHURCH_ADMIN_ALLOWED_ROLES.includes(role)) {
        throw new Error(`Church Admins cannot assign the role: ${role}`);
      }
    }
  }

  // Only Master Admin can assign RootAdmin/SystemAdmin
  if (!isMasterAdmin) {
    for (const role of newRoles) {
      if (MASTER_ONLY_ROLES.includes(role)) {
        throw new Error(`Only Master Admin can assign the role: ${role}`);
      }
    }
  }

  // 3. Apply update
  await userRef.update({ roles: newRoles });

  // 4. Log the role change
  await logSystemEvent({
    type: "ROLE_UPDATED",
    actorUid,
    actorName,
    targetId: userId,
    targetType: "USER",
    message: `Updated roles for ${before.email ?? "Unknown"}`,
    before: { roles: oldRoles },
    after: { roles: newRoles },
    metadata: {
      changedBy: actorUid,
      changedByName: actorName,
    },
  });

  return { success: true };
}
