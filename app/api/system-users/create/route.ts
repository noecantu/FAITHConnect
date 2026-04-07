import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase/admin";
import { logSystemEvent } from "@/app/lib/system/logging";
import { serverTimestamp } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password, actorUid, actorName } =
      await req.json();

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
      churchId: null,
      createdAt: serverTimestamp(),
    });

    // 3. Log system event
    await logSystemEvent({
      type: "SYSTEM_USER_CREATED",
      actorUid,
      actorName,
      targetId: userRecord.uid,
      targetType: "SYSTEM_USER",
      message: `Created system-level user: ${email}`,
      metadata: {},
    });

    return NextResponse.json({ success: true, userId: userRecord.uid });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create system user" },
      { status: 500 }
    );
  }
}
