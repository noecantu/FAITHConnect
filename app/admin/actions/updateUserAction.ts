"use server";

import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { logSystemEvent } from "@/lib/system/logging";

export interface UpdateUserInput {
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string[];
  churchId?: string;
  actorUid: string;
  actorName?: string | null;
}

export async function updateUserAction(input: UpdateUserInput) {
  const { userId, actorUid, actorName, ...updates } = input;

  const userRef = adminDb.collection("users").doc(userId);
  const snap = await userRef.get();

  if (!snap.exists) throw new Error("User not found");

  const before = snap.data() || {};

  await userRef.update(updates);

  await logSystemEvent({
    type: "USER_UPDATED",
    actorUid,
    actorName,
    targetId: userId,
    targetType: "USER",
    message: `Updated user: ${before.email ?? "Unknown"}`,
    before,
    after: { ...before, ...updates },
  });

  return { success: true };
}
