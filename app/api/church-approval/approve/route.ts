export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    // 1. Verify session
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }
    const callerUid = authUser.id;

    // 2. Load caller from users table (not app_metadata which may be stale)
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

    // 3. Parse body — frontend sends church_id
    const body = await req.json();
    const churchId: string = body.churchId ?? body.church_id;
    if (!churchId || typeof churchId !== "string") {
      return NextResponse.json({ error: "Missing churchId" }, { status: 400 });
    }

    // 4. Load the church doc
    const { data: churchData, error: churchError } = await adminDb
      .from("churches")
      .select("*")
      .eq("id", churchId)
      .single();

    if (churchError || !churchData) {
      return NextResponse.json({ error: "Church not found" }, { status: 404 });
    }

    // Use snake_case column name
    const regionSelectedId = churchData.region_selected_id;
    if (!regionSelectedId) {
      return NextResponse.json({ error: "No pending region request on church" }, { status: 400 });
    }

    // 5. Non-system users: verify caller owns the region being requested
    if (!isSystem) {
      const callerRegionId = caller.region_id;
      if (!callerRegionId || callerRegionId !== regionSelectedId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // 6. Approve the church — use snake_case columns
    const { error: updateChurchError } = await adminDb
      .from("churches")
      .update({
        region_id: regionSelectedId,
        region_selected_id: null,
        region_status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", churchId);

    if (updateChurchError) throw updateChurchError;

    // 7. Grant the Regional Admin auditor access to this church
    const { data: userData, error: userFetchError } = await adminDb
      .from("users")
      .select("roles_by_church, managed_church_ids")
      .eq("id", callerUid)
      .single();

    if (userFetchError) throw userFetchError;

    const updatedRolesByChurch = {
      ...(userData.roles_by_church || {}),
      [churchId]: ["ChurchAuditor"],
    };

    const existingManagedIds = Array.isArray(userData.managed_church_ids) ? userData.managed_church_ids : [];
    const updatedManagedChurchIds = Array.from(new Set([...existingManagedIds, churchId]));

    const { error: updateUserError } = await adminDb
      .from("users")
      .update({
        roles_by_church: updatedRolesByChurch,
        managed_church_ids: updatedManagedChurchIds,
      })
      .eq("id", callerUid);

    if (updateUserError) throw updateUserError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("church-approval/approve error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

