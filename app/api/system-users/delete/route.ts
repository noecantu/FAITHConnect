export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb, getAdminClient } from "@/app/lib/supabase/admin";
import { can } from "@/app/lib/auth/permissions";
import { SYSTEM_ROLE_LIST, type Role } from "@/app/lib/auth/roles";

function readEntityName(row: Record<string, unknown> | null, fallback: string) {
  if (!row) return fallback;
  const name = row.name;
  return typeof name === "string" && name.trim().length > 0 ? name : fallback;
}

export async function POST(req: Request) {
  try {
    const { uid } = await req.json();

    if (!uid || typeof uid !== "string") {
      return NextResponse.json({ error: "Missing uid." }, { status: 400 });
    }

    const actor = await getServerUser();
    if (!actor) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const actorUid = actor.id;

    if (actorUid === uid) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    const { data: actorData } = await adminDb.from("users").select("roles").eq("id", actorUid).single();
    if (!actorData) {
      return NextResponse.json({ error: "Actor profile not found." }, { status: 403 });
    }

    const actorRoles = (Array.isArray(actorData.roles) ? actorData.roles : []) as Role[];

    if (!can(actorRoles, "system.manage")) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const { data: userData } = await adminDb.from("users").select("*").eq("id", uid).single();
    if (!userData) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const targetRoles = (Array.isArray(userData.roles) ? userData.roles : []) as Role[];
    const isSystemUser = targetRoles.some((role) => SYSTEM_ROLE_LIST.includes(role));

    if (!isSystemUser) {
      return NextResponse.json({ error: "This endpoint only deletes system users." }, { status: 400 });
    }

    const regionId = typeof userData.region_id === "string" ? userData.region_id : null;
    const districtId = typeof userData.district_id === "string" ? userData.district_id : null;

    if (regionId) {
      const [{ data: assignedChurches }, { data: pendingChurches }, { data: regionData }] = await Promise.all([
        adminDb.from("churches").select("id, name").eq("region_id", regionId).limit(1),
        adminDb.from("churches").select("id, name").eq("region_selected_id", regionId).limit(1),
        adminDb.from("regions").select("*").eq("id", regionId).single(),
      ]);

      const assignedChurch = assignedChurches?.[0] ? readEntityName(assignedChurches[0] as Record<string, unknown>, assignedChurches[0].id) : null;
      const pendingChurch = pendingChurches?.[0] ? readEntityName(pendingChurches[0] as Record<string, unknown>, pendingChurches[0].id) : null;

      if (assignedChurch || pendingChurch) {
        const blocker = assignedChurch
          ? `assigned church "${assignedChurch}"`
          : `pending church request "${pendingChurch}"`;
        return NextResponse.json(
          { error: `This regional leader cannot be deleted yet because of ${blocker}. Reassign or clear that church relationship first.` },
          { status: 409 }
        );
      }

      if (regionData) {
        const parentDistrictId = typeof regionData.district_id === "string" ? regionData.district_id : null;
        if (parentDistrictId) {
          const { data: districtRow } = await adminDb.from("districts").select("region_ids").eq("id", parentDistrictId).single();
          if (districtRow) {
            const regionIds = Array.isArray(districtRow.region_ids) ? districtRow.region_ids.filter((id: string) => id !== regionId) : [];
            await adminDb.from("districts").update({ region_ids: regionIds }).eq("id", parentDistrictId);
          }
        }
        await adminDb.from("regions").delete().eq("id", regionId);
      }
    }

    if (districtId) {
      const [{ data: approvedRegions }, { data: pendingRegions }] = await Promise.all([
        adminDb.from("regions").select("id, name").eq("district_id", districtId).limit(1),
        adminDb.from("regions").select("id, name").eq("district_selected_id", districtId).limit(1),
      ]);

      const approvedRegion = approvedRegions?.[0] ? readEntityName(approvedRegions[0] as Record<string, unknown>, approvedRegions[0].id) : null;
      const pendingRegion = pendingRegions?.[0] ? readEntityName(pendingRegions[0] as Record<string, unknown>, pendingRegions[0].id) : null;

      if (approvedRegion || pendingRegion) {
        const blocker = approvedRegion
          ? `assigned region "${approvedRegion}"`
          : `pending region request "${pendingRegion}"`;
        return NextResponse.json(
          { error: `This district leader cannot be deleted yet because of ${blocker}. Reassign or clear that region relationship first.` },
          { status: 409 }
        );
      }

      await adminDb.from("districts").delete().eq("id", districtId);
    }

    // Delete the auth user
    const { error: deleteAuthError } = await getAdminClient().auth.admin.deleteUser(uid);
    if (deleteAuthError && !deleteAuthError.message.includes("not found")) {
      throw deleteAuthError;
    }

    // Delete the user profile
    await adminDb.from("users").delete().eq("id", uid);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("system-users/delete error:", error);
    return NextResponse.json({ error: "Failed to delete system user." }, { status: 500 });
  }
}