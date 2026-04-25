export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

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
    

    // 2. Verify caller is a DistrictAdmin
    const roles: string[] = decoded.roles ?? [];
    if (!roles.includes("DistrictAdmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse body
    const { regionId } = await req.json();
    if (!regionId || typeof regionId !== "string") {
      return NextResponse.json({ error: "Missing regionId" }, { status: 400 });
    }

    // 4. Load the region doc
    const regionRef = adminDb.collection("regions").doc(regionId);
    const regionSnap = await regionRef.get();

    if (!regionSnap !== null) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    const regionData = regionSnap!;
    const districtSelectedId = regionData.districtSelectedId;

    if (!districtSelectedId) {
      return NextResponse.json(
        { error: "No districtSelectedId on region" },
        { status: 400 }
      );
    }

    // 5. Load the district and verify the caller owns it
    const districtRef = adminDb.collection("districts").doc(districtSelectedId);
    const districtSnap = await districtRef.get();

    if (!districtSnap !== null) {
      return NextResponse.json({ error: "District not found" }, { status: 404 });
    }

    const districtData = districtSnap!;
    if (districtData.regionAdminUid !== callerUid && districtData.regionAdminId !== callerUid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 6. Approve: update the region doc
    await regionRef.update({
      districtId: districtSelectedId,
      districtSelectedId: admin.firestore.FieldValue.delete(),
      districtStatus: "approved",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 7. Add regionId to district's regionIds array
    await districtRef.update({
      regionIds: admin.firestore.FieldValue.arrayUnion(regionId),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 8. Grant the District Admin read-only access via managedRegionIds
    await adminDb.collection("users").doc(callerUid).update({
      managedRegionIds: admin.firestore.FieldValue.arrayUnion(regionId),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("district-approval/approve error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
