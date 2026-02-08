// app/admin/actions/createSystemUserAction.ts
"use server";

import { adminAuth, adminDb } from "@/lib/firebase/firebaseAdmin";
import { logSystemEvent } from "@/lib/system/logging";
import { SystemRole } from "@/app/lib/system-roles";

export interface CreateSystemUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  // accountType: SystemRole;
  actorUid: string;
  actorName?: string | null;
}

export async function createSystemUserAction(input: CreateSystemUserInput) {
  const {
    firstName,
    lastName,
    email,
    password,
    // accountType,
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
    churchId: null,          // system users never belong to a church
    // roles: [accountType],    // ⭐ FIX: system role stored correctly
    createdAt: new Date().toISOString(),
  });

  // 3. Log system event
  await logSystemEvent({
    type: "SYSTEM_USER_CREATED",
    actorUid,
    actorName,
    targetId: userRecord.uid,
    targetType: "SYSTEM_USER",
    message: `Created system-level user: ${email}`,
    metadata: {
      // accountType,
    },
  });

  return { success: true, userId: userRecord.uid };
}
