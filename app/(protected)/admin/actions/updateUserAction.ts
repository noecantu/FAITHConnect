"use server";

import { adminDb } from "@/app/lib/firebase/firebaseAdmin";
import { logSystemEvent } from "@/app/lib/system/logging";

export interface UpdateUserInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string[];
  churchId?: string | null;
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

  const isSelf = actorUid === userId;
  const isRootAdmin = actor.roles?.includes("RootAdmin");
  const targetIsAdmin = before.roles?.includes("Admin");
  const removingAdmin = targetIsAdmin && newRoles && !newRoles.includes("Admin");

  // -------------------------------
  // 1. Prevent self-demotion
  // -------------------------------
  if (isSelf && removingAdmin && !isRootAdmin) {
    throw new Error("You cannot remove your own Admin role.");
  }

  // -------------------------------
  // 2. Prevent removing the last Admin in the church
  // -------------------------------
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

  // -------------------------------
  // 3. Apply updates (roles + fields)
  // -------------------------------
  const finalUpdates = {
    ...updates,
    ...(newRoles ? { roles: newRoles } : {}),
  };

  await userRef.update(finalUpdates);

  // -------------------------------
  // 4. Log the event
  // -------------------------------
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
