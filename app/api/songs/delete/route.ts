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
    const songId = typeof body?.songId === "string" ? body.songId : null;

    if (!churchId || !songId) {
      return NextResponse.json({ error: "Missing churchId or songId" }, { status: 400 });
    }

    if (
      !canManageChurch({
        roles,
        callerChurchId: caller.church_id ?? null,
        managedChurchIds,
        targetChurchId: churchId,
      })
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await adminDb
      .from("songs")
      .delete()
      .eq("id", songId)
      .eq("church_id", churchId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}