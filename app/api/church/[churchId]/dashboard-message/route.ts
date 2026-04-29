import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/app/lib/supabase/admin";
import { getServerUser } from "@/app/lib/supabase/server";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";
import type { Permission } from "@/app/lib/auth/permissions";

export const runtime = "nodejs";

type DashboardMessageVisibility = "all" | "staff" | "leaders" | "admins";

type DashboardMessagePayload = {
  id: string;
  enabled: boolean;
  type: "quote" | "verse" | "reminder";
  title: string;
  message: string;
  reference: string;
  visibility: DashboardMessageVisibility;
  startAt: string | null;
  endAt: string | null;
  updatedAt: string;
};

function normalizeMessage(raw: unknown): DashboardMessagePayload | null {
  if (!raw || typeof raw !== "object") return null;

  const data = raw as Record<string, unknown>;
  const id = String(data.id ?? "").trim();
  const type = String(data.type ?? "reminder").trim().toLowerCase();
  const title = String(data.title ?? "").trim();
  const message = String(data.message ?? "").trim();
  const reference = String(data.reference ?? "").trim();
  const visibility = String(data.visibility ?? "all").trim().toLowerCase();
  const hasAnyContent = Boolean(title || message || reference);
  const enabled = typeof data.enabled === "boolean" ? data.enabled : hasAnyContent;

  const toIsoOrNull = (value: unknown) => {
    const normalized = String(value ?? "").trim();
    if (!normalized) return null;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString();
  };

  const startAt = toIsoOrNull(data.startAt);
  const endAt = toIsoOrNull(data.endAt);

  const normalizedMessage: DashboardMessagePayload = {
    id: id || crypto.randomUUID(),
    enabled,
    type: type === "quote" || type === "verse" ? type : "reminder",
    title,
    message,
    reference,
    visibility:
      visibility === "staff" || visibility === "leaders" || visibility === "admins"
        ? visibility
        : "all",
    startAt,
    endAt,
    updatedAt: new Date().toISOString(),
  };

  if (!enabled && !title && !message && !reference) {
    return null;
  }

  return normalizedMessage;
}

function normalizeMessages(raw: unknown): DashboardMessagePayload[] {
  if (Array.isArray(raw)) {
    return raw
      .map((entry) => normalizeMessage(entry))
      .filter((entry): entry is DashboardMessagePayload => entry !== null);
  }

  const single = normalizeMessage(raw);
  return single ? [single] : [];
}

type UserRoleContextResult =
  | {
      ok: true;
      roles: Role[];
      grants: Permission[];
      churchId: string | null;
    }
  | {
      ok: false;
      error: string;
    };

async function getUserRoleContext(userId: string): Promise<UserRoleContextResult> {
  const { data: profile, error } = await adminDb
    .from("users")
    .select("roles, permissions, church_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };

  return {
    ok: true,
    roles: (profile?.roles ?? []) as Role[],
    grants: (profile?.permissions ?? []) as Permission[],
    churchId: profile?.church_id as string | null,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  const { churchId } = await params;

  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const context = await getUserRoleContext(user.id);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: 500 });
  }

  const canManageSystem = can(context.roles, "system.manage", context.grants);
  const canReadMessages = can(context.roles, "messages.read", context.grants);
  const canManageMessages = can(context.roles, "messages.manage", context.grants);

  if (!canManageSystem && context.churchId !== churchId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!canManageSystem && !canReadMessages && !canManageMessages) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: church, error } = await adminDb
    .from("churches")
    .select("settings")
    .eq("id", churchId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const settings = church?.settings && typeof church.settings === "object"
    ? (church.settings as Record<string, unknown>)
    : {};

  const dashboardMessages =
    Array.isArray(settings.dashboardMessages) || settings.dashboardMessages
      ? normalizeMessages(settings.dashboardMessages)
      : normalizeMessages(settings.dashboardMessage);

  return NextResponse.json({
    dashboardMessages,
    dashboardMessage: dashboardMessages[0] ?? null,
    canManage: canManageSystem || canManageMessages,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ churchId: string }> }
) {
  const { churchId } = await params;

  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const context = await getUserRoleContext(user.id);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: 500 });
  }

  const canManageSystem = can(context.roles, "system.manage", context.grants);
  const canManageMessages = can(context.roles, "messages.manage", context.grants);

  if (!canManageSystem && context.churchId !== churchId) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!canManageSystem && !canManageMessages) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const incomingMessages =
    Array.isArray(record.dashboardMessages) || record.dashboardMessages
      ? record.dashboardMessages
      : record.dashboardMessage;
  const normalizedMessages = normalizeMessages(incomingMessages);

  const { data: church, error: readError } = await adminDb
    .from("churches")
    .select("settings")
    .eq("id", churchId)
    .maybeSingle();

  if (readError) {
    return NextResponse.json({ error: readError.message }, { status: 500 });
  }

  const currentSettings =
    church?.settings && typeof church.settings === "object"
      ? (church.settings as Record<string, unknown>)
      : {};

  const updates = {
    settings: {
      ...currentSettings,
      dashboardMessages: normalizedMessages,
      dashboardMessage: normalizedMessages[0] ?? null,
    },
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await adminDb
    .from("churches")
    .update(updates)
    .eq("id", churchId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    dashboardMessages: normalizedMessages,
    dashboardMessage: normalizedMessages[0] ?? null,
  });
}
