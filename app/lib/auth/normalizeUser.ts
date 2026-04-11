// app/lib/auth/normalizeUser.ts
// New with redundancy Removal

import type { User } from "@/app/lib/types";
import type { Role } from "./roles";

export function normalizeUser(raw: any, uid: string): User {
  return {
    id: uid,
    email: raw.email ?? "",
    roles: (raw.roles ?? []) as Role[],
    churchId: raw.churchId ?? null,
    regionId: raw.regionId ?? null,
    firstName: raw.firstName ?? null,
    lastName: raw.lastName ?? null,
    profilePhotoUrl: raw.profilePhotoUrl ?? null,
    settings: raw.settings ?? {},
  };
}
