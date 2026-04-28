export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "Missing uid." }, { status: 400 });
    }

    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const actorUid = authUser.id;

    const { data: actor } = await adminDb.from("users").select("roles, church_id").eq("id", actorUid).single();
    if (!actor) {
      return NextResponse.json({ error: "Actor profile not found." }, { status: 403 });
    }

    const actorRoles = (Array.isArray(actor.roles) ? actor.roles : []) as Role[];
    const actorChurchId = typeof actor.church_id === "string" ? actor.church_id : null;

    if (!can(actorRoles, "church.manage") && !can(actorRoles, "system.manage")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: target } = await adminDb.from("users").select("church_id, roles, email").eq("id", uid).single();
    if (!target) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    const targetChurchId = typeof target.church_id === "string" ? target.church_id : null;
    const targetRoles = Array.isArray(target.roles) ? target.roles : [];
    const isChurchAdmin = targetRoles.includes("Admin");

    if (!targetChurchId) {
      return NextResponse.json({ error: "Target user is not assigned to a church." }, { status: 400 });
    }

    if (!isChurchAdmin) {
      return NextResponse.json({ error: "Billing owner must be a church Admin." }, { status: 400 });
    }

    if (actorChurchId && actorChurchId !== targetChurchId && !can(actorRoles, "system.manage")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const billingContactEmail = typeof target.email === "string" ? target.email : null;

    const { error: updateError } = await adminDb
      .from("churches")
      .update({
        billing_owner_uid: uid,
        billing_contact_email: billingContactEmail,
        billing_updated_at: new Date().toISOString(),
      })
      .eq("id", targetChurchId);

    if (updateError) {
      console.error("transfer-billing-owner update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("church-users/transfer-billing-owner error:", error);
    return NextResponse.json(
      { error: "Failed to transfer billing ownership." },
      { status: 500 }
    );
  }
}
