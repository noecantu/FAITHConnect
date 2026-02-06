"use server";

import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { logSystemEvent } from "@/lib/system/logging";

export interface UpdateChurchInput {
  churchId: string;
  name?: string;
  address?: string;
  actorUid: string;
  actorName?: string | null;
}

export async function updateChurchAction(input: UpdateChurchInput) {
  const { churchId, actorUid, actorName, ...updates } = input;

  // 1. Load existing church data
  const ref = adminDb.collection("churches").doc(churchId);
  const snap = await ref.get();

  if (!snap.exists) throw new Error("Church not found");

  const before = snap.data() || {};

  // 2. Apply update
  await ref.update(updates);

  // 3. Log diff
  await logSystemEvent({
    type: "CHURCH_UPDATED",
    actorUid,
    actorName,
    targetId: churchId,
    targetType: "CHURCH",
    message: `Updated church: ${before.name ?? "Unknown"}`,
    before,
    after: { ...before, ...updates },
  });

  return { success: true };
}
