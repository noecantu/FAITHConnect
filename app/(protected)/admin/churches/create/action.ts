"use server";

import { adminDb } from "@/lib/firebase/firebaseAdmin";
import { logSystemEvent } from "@/lib/system/logging";
import { serverTimestamp } from "firebase/firestore";

export interface CreateChurchInput {
  name: string;
  address?: string;
  actorUid: string;
  actorName?: string | null;
}

export async function createChurchAction(input: CreateChurchInput) {
  const { name, address, actorUid, actorName } = input;

  // 1. Create church document
  const ref = await adminDb.collection("churches").add({
    name,
    address: address ?? null,
    createdAt: serverTimestamp(),
  });

  // 2. Log system event
  await logSystemEvent({
    type: "CHURCH_CREATED",
    actorUid,
    actorName,
    targetId: ref.id,
    targetType: "CHURCH",
    message: `Created church: ${name}`,
    metadata: { name, address },
  });

  return { success: true, churchId: ref.id };
}
