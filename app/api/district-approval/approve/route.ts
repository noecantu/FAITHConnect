export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const callerUid = authUser.id;

    const { data: caller } = await adminDb
      .from("users")
      .select("roles, managed_region_ids")
      .eq("id", callerUid)
      .single();

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = Array.isArray(caller.roles) ? caller.roles : [];
    const isSystem = roles.includes("RootAdmin") || roles.includes("SystemAdmin");
    if (!isSystem && !roles.includes("DistrictAdmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { regionId } = await req.json();
    if (!regionId || typeof regionId !== "string") {
      return NextResponse.json({ error: "Missing regionId" }, { status: 400 });
    }

    const { data: region } = await adminDb
      .from("regions")
      .select("*")
      .eq("id", regionId)
      .single();

    if (!region) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    const districtSelectedId = region.district_selected_id;
    if (!districtSelectedId) {
      return NextResponse.json({ error: "No pending district on region" }, { status: 400 });
    }

    const { data: district } = await adminDb
      .from("districts")
      .select("*")
      .eq("id", districtSelectedId)
      .single();

    if (!district) {
      return NextResponse.json({ error: "District not found" }, { status: 404 });
    }

    if (!isSystem && district.region_admin_id !== callerUid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Approve: link region to district and clear the pending request
    await adminDb
      .from("regions")
      .update({
        district_id: districtSelectedId,
        district_selected_id: null,
        district_status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", regionId);

    // Add regionId to district's region_ids array (if column exists)
    const existingRegionIds: string[] = Array.isArray(district.region_ids) ? district.region_ids : [];
    if (!existingRegionIds.includes(regionId)) {
      await adminDb
        .from("districts")
        .update({
          region_ids: [...existingRegionIds, regionId],
          updated_at: new Date().toISOString(),
        })
        .eq("id", districtSelectedId);
    }

    // Grant the District Admin access via managed_region_ids
    const existingManaged: string[] = Array.isArray(caller.managed_region_ids)
      ? caller.managed_region_ids
      : [];
    if (!existingManaged.includes(regionId)) {
      await adminDb
        .from("users")
        .update({ managed_region_ids: [...existingManaged, regionId] })
        .eq("id", callerUid);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("district-approval/approve error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
