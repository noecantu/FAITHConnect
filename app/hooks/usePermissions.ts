// app/hooks/usePermissions.ts
// New with redundancy Removal
"use client";

import { useAuth } from "./useAuth";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

export function usePermissions() {
  const { user } = useAuth();
  const roles = (user?.roles ?? []) as Role[];

  return {
    roles,

    canManageChurch: can(roles, "church.manage"),

    canManageMembers: can(roles, "members.manage"),
    canReadMembers: can(roles, "members.read"),

    canManageContributions: can(roles, "contributions.manage"),
    canReadContributions: can(roles, "contributions.read"),

    canManageEvents: can(roles, "events.manage"),
    canReadEvents: can(roles, "events.read"),

    canManageMusic: can(roles, "music.manage"),
    canReadMusic: can(roles, "music.read"),

    canManageServicePlans: can(roles, "servicePlans.manage"),
    canReadServicePlans: can(roles, "servicePlans.read"),

    canManageAttendance: can(roles, "attendance.manage"),
    canReadAttendance: can(roles, "attendance.read"),

    canAssignRoles: can(roles, "roles.assign"),
    canManageSystem: can(roles, "system.manage"),
  };
}
