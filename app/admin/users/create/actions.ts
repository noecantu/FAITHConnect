"use server";

import { adminAuth, adminDb } from "@/lib/firebase/firebaseAdmin";
import { logSystemEvent } from "@/lib/system/logging";

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roles: string[];
  churchId: string;
  actorUid: string;
  actorName?: string | null;
}

export async function createUserAction(input: CreateUserInput) {
  const {
    firstName,
    lastName,
    email,
    password,
    roles,
    churchId,
    actorUid,
    actorName,
  } = input;

  // 1. Create Auth user
  const userRecord = await adminAuth.createUser({
    email,
    password,
    displayName: `${firstName} ${lastName}`.trim(),
  });

  // 2. Create Firestore user document
  await adminDb.collection("users").doc(userRecord.uid).set({
    firstName,
    lastName,
    displayName: `${firstName} ${lastName}`.trim(),
    email,
    roles,
    churchId,
    createdAt: new Date().toISOString(),
  });

  // 3. Log system event
  await logSystemEvent({
    type: "USER_CREATED",
    actorUid,
    actorName,
    targetId: userRecord.uid,
    targetType: "USER",
    message: `Created user: ${email}`,
    metadata: {
      roles,
      churchId,
    },
  });

  return { success: true, userId: userRecord.uid };
}
