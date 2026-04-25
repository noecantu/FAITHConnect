export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "Missing uid." }, { status: 400 });
    }

    const actor = await getServerUser();
    if (!actor) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const actorUid = actor.id;

    if (actorUid === uid) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    const { data: actorData } = await adminDb.from("users").select("roles, church_id").eq("id", actorUid).single();
    if (!actorData) {
      return NextResponse.json({ error: "Actor profile not found." }, { status: 403 });
    }

    const actorRoles = (Array.isArray(actorData.roles) ? actorData.roles : []) as Role[];
    const actorChurchId = typeof actorData.church_id === "string" ? actorData.church_id : null;
    const canManageSystem = can(actorRoles, "system.manage");
    const canManageChurch = can(actorRoles, "church.manage");

    if (!canManageSystem && !canManageChurch) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: targetData } = await adminDb.from("users").select("church_id").eq("id", uid).single();
    if (!targetData) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const targetChurchId = typeof targetData.church_id === "string" ? targetData.church_id : null;

    if (!canManageSystem) {
      if (!actorChurchId || !targetChurchId || actorChurchId !== targetChurchId) {
        return NextResponse.json({ error: "Forbidden." }, { status: 403 });
      }
    }

    if (targetChurchId) {
      const { data: church } = await adminDb.from("churches").select("billing_owner_uid, created_by").eq("id", targetChurchId).single();
      if (church) {
        const billingOwnerUid = church.billing_owner_uid ?? church.created_by ?? null;
        if (billingOwnerUid === uid) {
          return NextResponse.json(
            { error: "This user is the billing owner for this church. Reassign billing ownership before deleting this account." },
            { status: 409 }
          );
        }
      }
    }

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(uid);
    if (deleteAuthError && !deleteAuthError.message.includes("not found")) {
      throw deleteAuthError;
    }

    await adminDb.from("users").delete().eq("id", uid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("church-users/delete error:", error);
    return NextResponse.json({ error: "Failed to delete user." }, { status: 500 });
  }
}

function readSessionCookie(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(/session=([^;]+)/);
  return match?.[1] ?? null;
}

async function deleteDocumentTree(ref: DocumentReference) {
  const subcollections = await ref.listCollections();

  for (const subcollection of subcollections) {
    const childRefs = await subcollection.listDocuments();

    for (const childRef of childRefs) {
      await deleteDocumentTree(childRef);
    }
  }

  await ref.delete();
}

