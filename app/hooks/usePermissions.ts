"use client";

import { useAuth } from "./useAuth";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

export function usePermissions() {
  const { user, loading } = useAuth();
  const roles = (user?.roles ?? []) as Role[];

  // Global roles
  const hasRole = (role: Role) => roles.includes(role);
  const isRootAdmin = hasRole("RootAdmin");
  const isSystemAdmin = hasRole("SystemAdmin");
  const isRegionalAdmin = hasRole("RegionalAdmin");
  const isSupport = hasRole("Support");
  const isAuditor = hasRole("Auditor");

  // Identifiers
  const regionId = user?.regionId ?? null;
  const churchId = user?.churchId ?? null;

  // Per-church auditor
  const rolesByChurch = user?.rolesByChurch ?? {};
  const managedChurchIds = user?.managedChurchIds ?? [];

  return {
    loading,
    user,
    roles,

    // Global role flags
    isRootAdmin,
    isSystemAdmin,
    isRegionalAdmin,
    isSupport,
    isAuditor,

    // Identifiers
    regionId,
    churchId,

    // Per-church auditor
    rolesByChurch,
    managedChurchIds,

    // Permissions
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
