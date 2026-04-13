import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase/admin";
import { logSystemEvent } from "@/app/lib/system/logging";
import admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      actorUid,
      actorName,
      roles,
      regionName,
      state,
      title, // NEW
    } = await req.json();

    // 1. Create Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`.trim(),
    });

    let regionId = null;

    // 2. If Regional Admin, create region document using the new user's UID
    if (roles?.includes("RegionalAdmin") && regionName) {
      regionId = userRecord.uid;

      await adminDb.collection("regions").doc(regionId).set({
        name: regionName,
        state: state || null,
        regionAdminUid: userRecord.uid,
        regionAdminName: `${firstName} ${lastName}`.trim(),
        regionAdminTitle: title || null, // NEW
        createdBy: actorUid,
        createdByName: actorName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 3. Create Firestore user document
    await adminDb.collection("users").doc(userRecord.uid).set({
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
      email,
      roles: roles || [],
      regionId: regionId,
      regionName: regionName || null,
      regionAdminTitle: title || null, // NEW
      state: state || null,
      churchId: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. Set custom claims
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      roles,
      regionId,
      regionAdminTitle: title || null, // NEW
    });

    // 5. Log system event
    await logSystemEvent({
      type: "SYSTEM_USER_CREATED",
      actorUid,
      actorName,
      targetId: userRecord.uid,
      targetType: "SYSTEM_USER",
      message: `Created system-level user: ${email}`,
      metadata: {
        roles,
        regionId,
        regionName,
        regionAdminTitle: title || null, // NEW
      },
    });

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      regionId,
    });

  } catch (err: any) {
    console.error("API error:", err);

    const firebaseMessage =
      err?.errorInfo?.message ||
      err?.message ||
      "Failed to create system user.";

    return NextResponse.json(
      { success: false, error: firebaseMessage },
      { status: 400 }
    );
  }
}
