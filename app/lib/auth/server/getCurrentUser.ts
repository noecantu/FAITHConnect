import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/app/lib/firebase/server";
import type { User } from "@/app/lib/types";
import type { Role } from "@/app/lib/auth/permissions/roles";

export async function getCurrentUser(): Promise<User | null> {
  const session = (await cookies()).get("session")?.value;
  if (!session) return null;

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);
    const snap = await adminDb.collection("users").doc(decoded.uid).get();

    if (!snap.exists) return null;

    const data = snap.data()!;

    return {
      id: decoded.uid,
      email: data.email,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      profilePhotoUrl: data.profilePhotoUrl ?? null,
      churchId: data.churchId ?? null,
      roles: (data.roles ?? []) as Role[],
      settings: data.settings ?? {},
    };
  } catch {
    return null;
  }
}
