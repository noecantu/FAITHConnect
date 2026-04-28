import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { getServerUser } from "@/app/lib/supabase/server";
import { can } from "@/app/lib/auth/permissions";

export const runtime = "nodejs";

function isMissingColumnError(err: unknown): boolean {
  const msg = err && typeof err === "object" && "message" in err
    ? String((err as { message?: unknown }).message ?? "")
    : "";
  const code = err && typeof err === "object" && "code" in err
    ? String((err as { code?: unknown }).code ?? "")
    : "";
  return code === "42703" || msg.toLowerCase().includes("column") || msg.toLowerCase().includes("does not exist");
}

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
    "timezone", "address", "address_1", "address_2", "city", "state", "zip", "country",
    "email", "phone", "leader_first_name", "leader_last_name", "leader_name", "leader_title",
    "region_id", "region_selected_id", "region_status",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  // Auto-compute combined leader_name from first + last when split fields provided
  if (("leader_first_name" in updates || "leader_last_name" in updates) && !("leader_name" in updates)) {
    const first = String(updates.leader_first_name ?? "").trim();
    const last = String(updates.leader_last_name ?? "").trim();
    updates.leader_name = [first, last].filter(Boolean).join(" ") || null;
  }

  // Keep legacy `address` and new `address_1` aligned for compatibility.
  if ("address_1" in updates && !("address" in updates)) {
    updates.address = updates.address_1;
  }
  if ("address" in updates && !("address_1" in updates)) {
    updates.address_1 = updates.address;
  }

  const primary = await adminDb
    .from("churches")
    .update(updates)
    .eq("id", churchId);

  if (primary.error) {
    if (!isMissingColumnError(primary.error)) {
      console.error("church profile update error:", primary.error);
      return NextResponse.json({ error: primary.error.message }, { status: 500 });
    }

    // Fallback for databases that have not added address_1/address_2 yet.
    const fallbackUpdates = { ...updates };
    delete fallbackUpdates.address_1;
    delete fallbackUpdates.address_2;

    const fallback = await adminDb
      .from("churches")
      .update(fallbackUpdates)
      .eq("id", churchId);

    if (fallback.error) {
      console.error("church profile update fallback error:", fallback.error);
      return NextResponse.json({ error: fallback.error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
