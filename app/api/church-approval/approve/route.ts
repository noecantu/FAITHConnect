export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase/admin";
import admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    // 1. Verify session
    const cookie = req.headers.get("cookie") || "";
    const session = cookie
      .split("; ")
      .find((c) => c.startsWith("session="))
      ?.split("=")[1];

    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const callerUid = decoded.uid;

    // 2. Verify caller is a RegionalAdmin
    const roles: string[] = decoded.roles ?? [];
    if (!roles.includes("RegionalAdmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse body
    const { churchId } = await req.json();
    if (!churchId || typeof churchId !== "string") {
      return NextResponse.json({ error: "Missing churchId" }, { status: 400 });
    }

    // 4. Load the church doc
    const churchRef = adminDb.collection("churches").doc(churchId);
    const churchSnap = await churchRef.get();

    if (!churchSnap.exists) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    const churchData = churchSnap.data()!;
    const regionSelectedId = churchData.regionSelectedId;

    if (!regionSelectedId) {
      return NextResponse.json(
        { error: "No regionSelectedId on church" },
        { status: 400 }
      );
    }

    // 5. Load the caller's region and verify they own it
    const regionSnap = await adminDb.collection("regions").doc(regionSelectedId).get();

    if (!regionSnap.exists) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    const regionData = regionSnap.data()!;
    if (regionData.regionAdminUid !== callerUid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 6. Approve the church
    await churchRef.update({
      regionId: regionSelectedId,
      regionSelectedId: null,
      regionStatus: "approved",
      updatedAt: new Date(),
    });

    // 7. Grant the Regional Admin read-only access to this church
    await adminDb.collection("users").doc(callerUid).update({
      [`rolesByChurch.${churchId}`]: ["ChurchAuditor"],
      managedChurchIds: admin.firestore.FieldValue.arrayUnion(churchId),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("church-approval/approve error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
