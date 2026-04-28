export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

// GET /api/church-users/list?churchId=<id>
export async function GET(req: Request) {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const churchId = searchParams.get("churchId");

    if (!churchId) {
      return NextResponse.json({ error: "churchId is required" }, { status: 400 });
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
    const actorChurchId = typeof actor.church_id === "string" ? actor.church_id : null;

    const isSystem = can(actorRoles, "system.manage");
    const isChurchManager = can(actorRoles, "church.manage");

    // Church admins can only list users for their own church
    if (!isSystem && !(isChurchManager && actorChurchId === churchId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await adminDb
      .from("users")
      .select("*")
      .eq("church_id", churchId)
      .order("last_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("church-users/list error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
