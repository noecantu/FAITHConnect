import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { getServerUser } from "@/app/lib/supabase/server";
import { can } from "@/app/lib/auth/permissions";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  const { churchId } = await params;

  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: profile } = await adminDb
    .from("users")
    .select("roles, church_id")
    .eq("id", user.id)
    .maybeSingle();

  const roles = profile?.roles ?? [];
  const canManageSystem = can(roles, "system.manage");
  const canManageChurch = can(roles, "church.manage");

  if (!canManageChurch && !canManageSystem) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Non-system admins can only update their own church
  if (!canManageSystem && profile?.church_id !== churchId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const allowed = [
    "timezone", "address", "city", "state", "zip", "country",
    "email", "phone", "leader_name", "leader_title",
    "region_id", "region_selected_id", "region_status",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { error } = await adminDb
    .from("churches")
    .update(updates)
    .eq("id", churchId);

  if (error) {
    console.error("church profile update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
