export const runtime = "nodejs";

import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { adminDb } from "@/app/lib/firebase/admin";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { can } from "@/app/lib/auth/permissions";

type UpdatePayload = {
  districtId?: unknown;
  name?: unknown;
  regionAdminTitle?: unknown;
  state?: unknown;
  logoUrl?: unknown;
};

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = (await req.json()) as UpdatePayload;
    const districtId = typeof body.districtId === "string" ? body.districtId : "";

    if (!districtId) {
      return NextResponse.json({ error: "Missing districtId." }, { status: 400 });
    }

    const roles = user.roles ?? [];
    const canManageSystem = can(roles, "system.manage");
    const canManageDistrict = can(roles, "district.manage");

    if (!canManageSystem && !canManageDistrict) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!canManageSystem && user.districtId !== districtId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const districtRef = adminDb.collection("districts").doc(districtId);
    const districtSnap = await districtRef.get();

    if (!districtSnap.exists) {
      return NextResponse.json({ error: "District not found." }, { status: 404 });
    }

    const updates: Record<string, unknown> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (typeof body.name === "string") {
      updates.name = body.name.trim();
    }

    if (typeof body.regionAdminTitle === "string") {
      updates.regionAdminTitle = body.regionAdminTitle.trim() || null;
    }

    if (typeof body.state === "string") {
      updates.state = body.state.trim() || null;
    }

    if (typeof body.logoUrl === "string" || body.logoUrl === null) {
      updates.logoUrl = body.logoUrl;
    }

    await districtRef.update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("district/settings/update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update district settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
