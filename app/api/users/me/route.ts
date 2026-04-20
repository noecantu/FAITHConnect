// app/api/users/me/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/app/lib/firebase/admin";
import { ROLE_PERMISSIONS } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

function resolvePermissions(roles: Role[]) {
  const perms = new Set<string>();
  for (const role of roles) {
    const p = ROLE_PERMISSIONS[role] ?? [];
    p.forEach((perm) => perms.add(perm));
  }
  return Array.from(perms);
}

export async function GET(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const session = cookie
      .split("; ")
      .find((c) => c.startsWith("session="))
      ?.split("=")[1];

    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    const snap = await adminDb.collection("users").doc(uid).get();
    const user = snap.data();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = user.roles ?? [];
    const permissions = resolvePermissions(roles);

    // ---------------------------------------------------------
    // FIX: Correct onboarding defaults
    // If the fields do NOT exist in Firestore, treat user as DONE.
    // ---------------------------------------------------------
    const onboardingComplete =
      user.onboardingComplete === undefined ? true : user.onboardingComplete;

    const onboardingStep =
      user.onboardingStep ?? "complete";

    // ---------------------------------------------------------
    // Return final JSON payload
    // ---------------------------------------------------------
    return NextResponse.json({
      uid,
      email: user.email ?? null,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      profilePhotoUrl: user.profilePhotoUrl ?? null,

      roles,
      permissions,
      churchId: user.churchId ?? null,
      regionId: user.regionId ?? null,
      regionName: user.regionName ?? null,
      managedChurchIds: user.managedChurchIds ?? [],
      rolesByChurch: user.rolesByChurch ?? {},

      onboardingStep,
      onboardingComplete,
    });

  } catch (err) {
    console.error("Error in /api/users/me:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}