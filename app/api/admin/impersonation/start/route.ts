export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb, getAdminClient } from "@/app/lib/supabase/admin";
import { logSystemEvent } from "@/app/lib/system/logging";
import { getAuthenticatedServerUser } from "@/app/lib/supabase/server";
import {
  IMPERSONATION_COOKIE_NAME,
  createImpersonationCookieValue,
  getImpersonationContext,
} from "@/app/lib/auth/impersonation";

const ROOT_ADMIN_EMAIL = (
  process.env.ROOT_ADMIN_EMAIL ??
  process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL ??
  "root@faithconnect.app"
)
  .trim()
  .toLowerCase();

export async function POST(req: NextRequest) {
  const actor = await getAuthenticatedServerUser();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const targetUid = typeof body?.targetUid === "string" ? body.targetUid.trim() : "";
  const returnTo = typeof body?.returnTo === "string" ? body.returnTo.trim() : undefined;

  if (!targetUid) {
    return NextResponse.json({ error: "Target user is required." }, { status: 400 });
  }

  if (targetUid === actor.id) {
    return NextResponse.json({ error: "Cannot impersonate yourself." }, { status: 400 });
  }

  const { data: actorData } = await adminDb
    .from("users")
    .select("roles, first_name, last_name, email")
    .eq("id", actor.id)
    .maybeSingle();

  const actorRoles = Array.isArray(actorData?.roles) ? actorData.roles : [];
  const actorIsRootAdmin = actorRoles.includes("RootAdmin") || (actor.email ?? "").trim().toLowerCase() === ROOT_ADMIN_EMAIL;

  if (!actorIsRootAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: targetAuth, error: targetAuthError } = await getAdminClient().auth.admin.getUserById(targetUid);
  if (targetAuthError || !targetAuth.user) {
    return NextResponse.json({ error: "Target user not found." }, { status: 404 });
  }

  const existingImpersonation = await getImpersonationContext(actor);
  const startedAt = new Date().toISOString();
  const response = NextResponse.json({
    ok: true,
    targetUid,
    targetEmail: targetAuth.user.email ?? null,
    startedAt,
    replacingExisting: Boolean(existingImpersonation),
  });

  response.cookies.set(IMPERSONATION_COOKIE_NAME, createImpersonationCookieValue({
    actorUid: actor.id,
    targetUid,
    startedAt,
    returnTo,
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  const actorName = actorData
    ? `${actorData.first_name ?? ""} ${actorData.last_name ?? ""}`.trim() || actorData.email || actor.email || actor.id
    : actor.email || actor.id;

  await logSystemEvent({
    type: "SYSTEM_EVENT",
    actorUid: actor.id,
    actorName,
    targetId: targetUid,
    targetType: "USER",
    message: existingImpersonation
      ? `Root Admin switched impersonation to ${targetAuth.user.email ?? targetUid}.`
      : `Root Admin started impersonating ${targetAuth.user.email ?? targetUid}.`,
    metadata: {
      action: existingImpersonation ? "IMPERSONATION_SWITCHED" : "IMPERSONATION_STARTED",
      targetEmail: targetAuth.user.email ?? null,
      startedAt,
    },
  });

  return response;
}