export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    // 1. Verify session using Supabase
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }
    const callerUid = authUser.id;

    // 2. Verify caller is a RegionalAdmin
    // Assuming roles are on authUser.user_metadata or we fetch from user profile
    // Based on previous files, roles might be in the 'users' table or on the user object.
    // For now, keeping the logic as close as possible to original.
    const roles: string[] = (authUser as any).app_metadata?.roles ?? [];
    if (!roles.includes("RegionalAdmin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Parse body
    const { churchId } = await req.json();
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

    const regionSelectedId = churchData.regionSelectedId;

    if (!regionSelectedId) {
      return NextResponse.json(
        { error: "No regionSelectedId on church" },
        { status: 400 }
      );
    }

    // 5. Load the caller's region and verify they own it
    const { data: regionData, error: regionError } = await adminDb
      .from("regions")
      .select("*")
      .eq("id", regionSelectedId)
      .single();

    if (regionError || !regionData) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 });
    }

    if (regionData.regionAdminUid !== callerUid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 6. Approve the church
    const { error: updateChurchError } = await adminDb
      .from("churches")
      .update({
        regionId: regionSelectedId,
        regionSelectedId: null,
        regionStatus: "approved",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", churchId);

    if (updateChurchError) throw updateChurchError;

    // 7. Grant the Regional Admin read-only access to this church
    // Supabase jsonb update for rolesByChurch and array_append for managedChurchIds
    const { data: userData, error: userFetchError } = await adminDb
      .from("users")
      .select("roles_by_church, managed_church_ids")
      .eq("id", callerUid)
      .single();

    if (userFetchError) throw userFetchError;

    const updatedRolesByChurch = {
      ...(userData.roles_by_church || {}),
      [churchId]: ["ChurchAuditor"]
    };
    
    const existingManagedIds = Array.isArray(userData.managed_church_ids) ? userData.managed_church_ids : [];
    const updatedManagedChurchIds = Array.from(new Set([...existingManagedIds, churchId]));

    const { error: updateUserError } = await adminDb
      .from("users")
      .update({
        roles_by_church: updatedRolesByChurch,
        managed_church_ids: updatedManagedChurchIds
      })
      .eq("id", callerUid);

    if (updateUserError) throw updateUserError;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("church-approval/approve error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
