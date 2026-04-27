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
      .select("roles, district_id")
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

    // Non-system users can only reject regions pending for their district
    if (!isSystem) {
      const districtId = caller.district_id;
      if (!districtId) {
        return NextResponse.json({ error: "No district associated with this user" }, { status: 400 });
      }

      const { data: region } = await adminDb
        .from("regions")
        .select("district_selected_id, district_status")
        .eq("id", regionId)
        .single();

      if (!region || region.district_selected_id !== districtId || region.district_status !== "pending") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { error } = await adminDb
      .from("regions")
      .update({
        district_status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", regionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("district-approval/reject error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
