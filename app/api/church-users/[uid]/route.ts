export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";
import type { Permission } from "@/app/lib/auth/permissions";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;

    if (!uid) {
      return NextResponse.json({ error: "uid is required" }, { status: 400 });
    }

    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { data: actor } = await adminDb
      .from("users")
      .select("roles, church_id")
      .eq("id", authUser.id)
      .single();

    if (!actor) {
      return NextResponse.json({ error: "Actor not found" }, { status: 403 });
    }

    const actorRoles = (actor.roles ?? []) as Role[];
    if (!can(actorRoles, "church.manage") && !can(actorRoles, "system.manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { churchId, firstName, lastName, roles, permissions } = body;

    if (!churchId) {
      return NextResponse.json({ error: "churchId is required" }, { status: 400 });
    }

    // Verify the target user belongs to the actor's church (unless system admin)
    const isSystem = can(actorRoles, "system.manage");
    const actorChurchId = typeof actor.church_id === "string" ? actor.church_id : null;
    if (!isSystem && actorChurchId !== churchId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof firstName === "string") update.first_name = firstName.trim();
    if (typeof lastName === "string") update.last_name = lastName.trim();
    if (Array.isArray(roles)) update.roles = roles as Role[];
    if (Array.isArray(permissions)) update.permissions = permissions as Permission[];

    const query = adminDb.from("users").update(update).eq("id", uid);
    // Non-system actors can only update users within their own church
    const { error } = isSystem ? await query : await query.eq("church_id", churchId);

    if (error) {
      console.error("church-users/[uid] PATCH error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("church-users/[uid] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
