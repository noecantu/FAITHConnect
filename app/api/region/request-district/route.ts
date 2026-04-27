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
      .select("roles, region_id")
      .eq("id", callerUid)
      .single();

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = Array.isArray(caller.roles) ? caller.roles : [];
    const isSystem = roles.includes("RootAdmin") || roles.includes("SystemAdmin");
    if (!isSystem && !roles.includes("RegionalAdmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { districtId } = await req.json();
    if (!districtId || typeof districtId !== "string") {
      return NextResponse.json({ error: "Missing districtId" }, { status: 400 });
    }

    const regionId = caller.region_id;
    if (!regionId) {
      return NextResponse.json({ error: "No region associated with this user" }, { status: 400 });
    }

    // Verify the district exists
    const { data: district } = await adminDb
      .from("districts")
      .select("id")
      .eq("id", districtId)
      .single();

    if (!district) {
      return NextResponse.json({ error: "District not found" }, { status: 404 });
    }

    const { error } = await adminDb
      .from("regions")
      .update({
        district_selected_id: districtId,
        district_status: "pending",
        district_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", regionId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("region/request-district error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
