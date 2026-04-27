export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { getServerUser } from "@/app/lib/supabase/server";
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
    const user = await getServerUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const body = (await req.json()) as UpdatePayload;
    const regionId = typeof body.regionId === "string" ? body.regionId : "";

    if (!regionId) {
      return NextResponse.json({ error: "Missing regionId." }, { status: 400 });
    }

    const { data: profile } = await adminDb
      .from("users")
      .select("roles, region_id")
      .eq("id", user.id)
      .single();

    const roles = profile?.roles ?? [];
    const canManageSystem = can(roles, "system.manage");
    const canManageRegion = can(roles, "region.manage");

    if (!canManageSystem && !canManageRegion) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!canManageSystem && profile?.region_id !== regionId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: region, error: fetchError } = await adminDb
      .from("regions")
      .select("*")
      .eq("id", regionId)
      .single();

    if (fetchError || !region) {
      return NextResponse.json({ error: "Region not found." }, { status: 404 });
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
      .from("regions")
      .update(updates)
      .eq("id", regionId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("region/settings/update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update region settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}