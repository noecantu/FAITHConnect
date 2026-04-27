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

    const body = await req.json();
    const churchId: string = body.churchId ?? body.church_id;
    if (!churchId || typeof churchId !== "string") {
      return NextResponse.json({ error: "Missing churchId" }, { status: 400 });
    }

    // Non-system: verify the church is pending for the caller's region
    if (!isSystem) {
      const callerRegionId = caller.region_id;
      if (!callerRegionId) {
        return NextResponse.json({ error: "No region associated with this user" }, { status: 400 });
      }

      const { data: church } = await adminDb
        .from("churches")
        .select("region_selected_id, region_status")
        .eq("id", churchId)
        .single();

      if (!church || church.region_selected_id !== callerRegionId || church.region_status !== "pending") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { error } = await adminDb
      .from("churches")
      .update({
        region_status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", churchId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("church-approval/reject error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
