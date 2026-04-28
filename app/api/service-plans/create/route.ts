export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServerUser } from "@/app/lib/supabase/server";
import { adminDb } from "@/app/lib/supabase/admin";

function canManageChurch(params: {
  roles: string[];
  callerChurchId: string | null;
  managedChurchIds: string[];
  targetChurchId: string;
}) {
  const { roles, callerChurchId, managedChurchIds, targetChurchId } = params;

  if (callerChurchId === targetChurchId) return true;
  if (managedChurchIds.includes(targetChurchId)) return true;

  return (
    roles.includes("RootAdmin") ||
    roles.includes("SystemAdmin") ||
    roles.includes("DistrictAdmin") ||
    roles.includes("RegionalAdmin")
  );
}

export async function POST(req: Request) {
  try {
    const authUser = await getServerUser();
    if (!authUser) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const { data: caller } = await adminDb
      .from("users")
      .select("roles, church_id, managed_church_ids")
      .eq("id", authUser.id)
      .single();

    if (!caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles: string[] = Array.isArray(caller.roles) ? caller.roles : [];
    const managedChurchIds: string[] = Array.isArray(caller.managed_church_ids)
      ? caller.managed_church_ids
      : [];

    const body = await req.json();
    const churchId = typeof body?.churchId === "string" ? body.churchId : null;

    if (!churchId) {
      return NextResponse.json({ error: "Missing churchId" }, { status: 400 });
    }

    if (!canManageChurch({ roles, callerChurchId: caller.church_id ?? null, managedChurchIds, targetChurchId: churchId })) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = Date.now();
    const createdBy = typeof body.createdBy === "string" && body.createdBy.trim().length > 0
      ? body.createdBy
      : authUser.id;
    const isPublic = typeof body?.isPublic === "boolean" ? body.isPublic : true;
    const groups = Array.isArray(body?.groups)
      ? body.groups.filter((group: unknown): group is string => typeof group === "string" && group.trim().length > 0)
      : [];

    if (!isPublic && groups.length === 0) {
      return NextResponse.json({ error: "Private service plans require at least one group" }, { status: 400 });
    }

    const { data: row, error } = await adminDb
      .from("service_plans")
      .insert({
        church_id: churchId,
        title: body.title,
        date_string: body.dateString,
        time_string: body.timeString,
        notes: body.notes ?? "",
        sections: body.sections ?? [],
        is_public: isPublic,
        groups: isPublic ? [] : groups,
        created_by: createdBy,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error || !row) {
      return NextResponse.json({ error: error?.message ?? "Failed to create service plan" }, { status: 400 });
    }

    return NextResponse.json({ row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
