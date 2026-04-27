"use client";

import { useAuth } from "./useAuth";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

export function usePermissions() {
  const { user, loading } = useAuth();
  const roles = (user?.roles ?? []) as Role[];

  const hasRole = (role: Role) => roles.includes(role);

  return {
    loading,
    user,
    roles,

    isRootAdmin: hasRole("RootAdmin"),
    isSystemAdmin: hasRole("SystemAdmin"),
    isDistrictAdmin: hasRole("DistrictAdmin"),
    isRegionalAdmin: hasRole("RegionalAdmin"),
    isSupport: hasRole("Support"),
    isAuditor: hasRole("Auditor"),

    regionId: user?.regionId ?? null,
    districtId: user?.districtId ?? null,
    churchId: user?.churchId ?? null,
    // Backward-compatible aliases for files not yet migrated to camelCase.
    region_id: user?.regionId ?? null,
    district_id: user?.districtId ?? null,
    church_id: user?.churchId ?? null,

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
    canReadReports: can(roles, "reports.read"),
    canManageServicePlans: can(roles, "servicePlans.manage"),
    canReadServicePlans: can(roles, "servicePlans.read"),
    canManageAttendance: can(roles, "attendance.manage"),
    canReadAttendance: can(roles, "attendance.read"),
    canAssignRoles: can(roles, "roles.assign"),
    canManageSystem: can(roles, "system.manage"),
  };
}
