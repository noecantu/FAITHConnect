export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

function readSessionCookie(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/session=([^;]+)/);
  return match?.[1] ?? null;
}

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "Missing uid." }, { status: 400 });
    }

    const sessionCookie = readSessionCookie(req);
    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    const actorUid = decoded.uid;

    const actorSnap = await adminDb.from("users").select("*").eq("id", actorUid).single();
    if (!actorSnap !== null) {
      return NextResponse.json({ error: "Actor profile not found." }, { status: 403 });
    }

    const actor = actorSnap as { roles?: unknown; church_id?: unknown };
    const actorRoles = (Array.isArray(actor.roles) ? actor.roles : []) as Role[];
    const actorChurchId = typeof actor.church_id === "string" ? actor.church_id : null;

    if (!can(actorRoles, "church.manage") && !can(actorRoles, "system.manage")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const targetSnap = await adminDb.from("users").select("*").eq("id", uid).single();
    if (!targetSnap !== null) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    const target = targetSnap as {
      church_id?: unknown;
      roles?: unknown;
      email?: unknown;
    };

    const targetChurchId = typeof target.church_id === "string" ? target.church_id : null;
    const targetRoles = Array.isArray(target.roles) ? target.roles : [];
    const isChurchAdmin = targetRoles.includes("Admin");

    if (!targetChurchId) {
      return NextResponse.json(
        { error: "Target user is not assigned to a church." },
        { status: 400 }
      );
    }

    if (!isChurchAdmin) {
      return NextResponse.json(
        { error: "Billing owner must be a church Admin." },
        { status: 400 }
      );
    }

    if (actorChurchId && actorChurchId !== targetChurchId && !can(actorRoles, "system.manage")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const billingContactEmail =
      typeof target.email === "string" ? target.email : null;

    await adminDb
      .collection("churches")
      .doc(targetChurchId)
      .set(
        {
          billingOwnerUid: uid,
          billingContactEmail,
          billingUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("church-users/transfer-billing-owner error:", error);
    return NextResponse.json(
      { error: "Failed to transfer billing ownership." },
      { status: 500 }
    );
  }
}
