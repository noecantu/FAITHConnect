export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { logSystemEvent } from "@/app/lib/system/logging";
import {
  IMPERSONATION_COOKIE_NAME,
  getImpersonationContext,
} from "@/app/lib/auth/impersonation";
import { getAuthenticatedServerUser } from "@/app/lib/supabase/server";

export async function POST() {
  const actor = await getAuthenticatedServerUser();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const impersonation = await getImpersonationContext(actor);
  const response = NextResponse.json({ ok: true, stopped: Boolean(impersonation) });

  response.cookies.set(IMPERSONATION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  if (!impersonation) {
    return response;
  }

  const { data: actorData } = await adminDb
    .from("users")
    .select("first_name, last_name, email")
    .eq("id", actor.id)
    .maybeSingle();

  const actorName = actorData
    ? `${actorData.first_name ?? ""} ${actorData.last_name ?? ""}`.trim() || actorData.email || actor.email || actor.id
    : actor.email || actor.id;

  await logSystemEvent({
    type: "SYSTEM_EVENT",
    actorUid: actor.id,
    actorName,
    targetId: impersonation.payload.targetUid,
    targetType: "USER",
    message: `Root Admin stopped impersonating ${impersonation.actingUser.email ?? impersonation.payload.targetUid}.`,
    metadata: {
      action: "IMPERSONATION_STOPPED",
      targetEmail: impersonation.actingUser.email ?? null,
      startedAt: impersonation.payload.startedAt,
      stoppedAt: new Date().toISOString(),
    },
  });

  return response;
}