import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";
import { getAdminClient } from "@/app/lib/supabase/admin";
import { getSupabaseAdminEnv } from "@/app/lib/supabase/env";
import { ROLES, type Role } from "@/app/lib/auth/roles";

export const IMPERSONATION_COOKIE_NAME = "fc_impersonation";

const ROOT_ADMIN_EMAIL = (
  process.env.ROOT_ADMIN_EMAIL ??
  process.env.NEXT_PUBLIC_ROOT_ADMIN_EMAIL ??
  process.env.ROOT_ADMIN_USER_EMAIL ??
  process.env.ROOTADMIN_EMAIL ??
  "root@faithconnect.app"
)
  .trim()
  .toLowerCase();

export type ImpersonationCookiePayload = {
  actorUid: string;
  targetUid: string;
  startedAt: string;
};

export type ImpersonationContext = {
  actorUser: User;
  actingUser: User;
  payload: ImpersonationCookiePayload;
};

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getImpersonationSecret(): string {
  const explicitSecret = process.env.IMPERSONATION_COOKIE_SECRET?.trim();
  if (explicitSecret) return explicitSecret;
  return getSupabaseAdminEnv().serviceRoleKey;
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getImpersonationSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function normalizeRoles(raw: unknown): Role[] {
  if (typeof raw === "string") {
    return ROLES.includes(raw as Role) ? [raw as Role] : [];
  }

  if (!Array.isArray(raw)) return [];

  const roles = new Set<Role>();
  raw.forEach((entry) => {
    if (typeof entry === "string" && ROLES.includes(entry as Role)) {
      roles.add(entry as Role);
    }
  });

  return [...roles];
}

async function actorCanImpersonate(actorUser: User): Promise<boolean> {
  const normalizedEmail = (actorUser.email ?? "").trim().toLowerCase();
  if (normalizedEmail && normalizedEmail === ROOT_ADMIN_EMAIL) {
    return true;
  }

  const { data } = await getAdminClient()
    .from("users")
    .select("roles")
    .eq("id", actorUser.id)
    .maybeSingle();

  return normalizeRoles(data?.roles).includes("RootAdmin");
}

export function createImpersonationCookieValue(payload: ImpersonationCookiePayload): string {
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function parseImpersonationCookieValue(cookieValue: string | undefined | null): ImpersonationCookiePayload | null {
  if (!cookieValue) return null;

  const [encodedPayload, signature] = cookieValue.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const actualSignatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    actualSignatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(actualSignatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64Url(encodedPayload)) as Partial<ImpersonationCookiePayload>;
    if (
      typeof parsed.actorUid !== "string" ||
      typeof parsed.targetUid !== "string" ||
      typeof parsed.startedAt !== "string"
    ) {
      return null;
    }

    return {
      actorUid: parsed.actorUid,
      targetUid: parsed.targetUid,
      startedAt: parsed.startedAt,
    };
  } catch {
    return null;
  }
}

export async function readImpersonationCookiePayload(): Promise<ImpersonationCookiePayload | null> {
  const cookieStore = await cookies();
  return parseImpersonationCookieValue(cookieStore.get(IMPERSONATION_COOKIE_NAME)?.value);
}

export async function getImpersonationContext(actorUser: User | null): Promise<ImpersonationContext | null> {
  if (!actorUser) return null;

  const payload = await readImpersonationCookiePayload();
  if (!payload || payload.actorUid !== actorUser.id || payload.targetUid === actorUser.id) {
    return null;
  }

  if (!(await actorCanImpersonate(actorUser))) {
    return null;
  }

  const { data, error } = await getAdminClient().auth.admin.getUserById(payload.targetUid);
  if (error || !data.user) return null;

  return {
    actorUser,
    actingUser: data.user,
    payload,
  };
}

export async function getActingServerUser(actorUser: User | null): Promise<User | null> {
  if (!actorUser) return null;

  const impersonation = await getImpersonationContext(actorUser);
  return impersonation?.actingUser ?? actorUser;
}