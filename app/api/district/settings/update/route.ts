export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { getServerUser } from "@/app/lib/supabase/server";
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
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = (await req.json()) as UpdatePayload;
    const districtId = typeof body.districtId === "string" ? body.districtId : "";

    if (!districtId) {
      return NextResponse.json({ error: "Missing districtId." }, { status: 400 });
    }

    const { data: profile } = await adminDb
      .from("users")
      .select("roles, district_id")
      .eq("id", user.id)
      .single();

    const roles = profile?.roles ?? [];
    const canManageSystem = can(roles, "system.manage");
    const canManageDistrict = can(roles, "district.manage");

    if (!canManageSystem && !canManageDistrict) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!canManageSystem && profile?.district_id !== districtId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: district, error: fetchError } = await adminDb
      .from("districts")
      .select("*")
      .eq("id", districtId)
      .single();

    if (fetchError || !district) {
      return NextResponse.json({ error: "District not found." }, { status: 404 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.name === "string") {
      updates.name = body.name.trim();
    }

    if (typeof body.regionAdminTitle === "string") {
      updates.region_admin_title = body.regionAdminTitle.trim() || null;
    }

    if (typeof body.state === "string") {
      updates.state = body.state.trim() || null;
    }

    if (typeof body.logoUrl === "string" || body.logoUrl === null) {
      updates.logo_url = body.logoUrl;
    }

    const { error: updateError } = await adminDb
      .from("districts")
      .update(updates)
      .eq("id", districtId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("district/settings/update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update district settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}