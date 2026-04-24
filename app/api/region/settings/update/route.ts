export const runtime = "nodejs";

import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { adminDb } from "@/app/lib/firebase/admin";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import { can } from "@/app/lib/auth/permissions";

type UpdatePayload = {
  regionId?: unknown;
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
    const regionId = typeof body.regionId === "string" ? body.regionId : "";

    if (!regionId) {
      return NextResponse.json({ error: "Missing regionId." }, { status: 400 });
    }

    const roles = user.roles ?? [];
    const canManageSystem = can(roles, "system.manage");
    const canManageRegion = can(roles, "region.manage");

    if (!canManageSystem && !canManageRegion) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!canManageSystem && user.regionId !== regionId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const regionRef = adminDb.collection("regions").doc(regionId);
    const regionSnap = await regionRef.get();

    if (!regionSnap.exists) {
      return NextResponse.json({ error: "Region not found." }, { status: 404 });
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

    await regionRef.update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("region/settings/update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update region settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
