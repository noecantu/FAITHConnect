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
      title,
      districtName,
      districtTitle,
      districtState,
    } = await req.json();

    // 1. Create Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`.trim(),
    });

    let regionId = null;
    let districtId = null;

    // 2. If Regional Admin, create region document using the new user's UID
    if (roles?.includes("RegionalAdmin") && regionName) {
      regionId = userRecord.uid;

      await adminDb.collection("regions").doc(regionId).set({
        name: regionName,
        state: state || null,
        regionAdminUid: userRecord.uid,
        regionAdminName: `${firstName} ${lastName}`.trim(),
        regionAdminTitle: title || null,
        createdBy: actorUid,
        createdByName: actorName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 2b. If District Admin, create district document using the new user's UID
    if (roles?.includes("DistrictAdmin") && districtName) {
      districtId = userRecord.uid;

      await adminDb.collection("districts").doc(districtId).set({
        name: districtName,
        regionAdminId: userRecord.uid,
        regionAdminUid: userRecord.uid,
        regionAdminName: `${firstName} ${lastName}`.trim(),
        regionAdminTitle: districtTitle || null,
        state: districtState || null,
        regionIds: [],
        churchIds: [],
        createdBy: actorUid,
        createdByName: actorName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // 3. Create Firestore user document
    await adminDb.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
      email,
      roles: roles || [],
      regionId: regionId,
      regionName: regionName || null,
      regionAdminTitle: title || null,
      state: state || null,
      districtId: districtId,
      districtName: districtName || null,
      districtTitle: districtTitle || null,
      districtState: districtState || null,
      churchId: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 4. Set custom claims
    await adminAuth.setCustomUserClaims(userRecord.uid, {
      roles,
      regionId,
      regionAdminTitle: title || null,
      districtId,
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
        regionAdminTitle: title || null,
        districtId,
        districtName: districtName || null,
      },
    });

    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      regionId,
      districtId,
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
