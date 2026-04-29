"use client";

import { useAuth } from "./useAuth";
import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";
import type { Permission } from "@/app/lib/auth/permissions";

export function usePermissions() {
  const { user, loading } = useAuth();
  const roles = (user?.roles ?? []) as Role[];
  const grants = (user?.permissions ?? []) as Permission[];

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
    canManageChurch: can(roles, "church.manage", grants),
    canManageMessages: can(roles, "messages.manage", grants),
    canReadMessages: can(roles, "messages.read", grants),
    canManageMembers: can(roles, "members.manage", grants),
    canReadMembers: can(roles, "members.read", grants),
    canManageContributions: can(roles, "contributions.manage", grants),
    canReadContributions: can(roles, "contributions.read", grants),
    canManageEvents: can(roles, "events.manage", grants),
    canReadEvents: can(roles, "events.read", grants),
    canManageMusic: can(roles, "music.manage", grants),
    canReadMusic: can(roles, "music.read", grants),
    canReadReports: can(roles, "reports.read", grants),
    canReadAttendanceReports: can(roles, "reports.attendance", grants),
    canReadContributionsReports: can(roles, "reports.contributions", grants),
    canReadMembersReports: can(roles, "reports.members", grants),
    canReadSetListsReports: can(roles, "reports.setlists", grants),
    canReadServicePlansReports: can(roles, "reports.serviceplans", grants),
    canManageServicePlans: can(roles, "servicePlans.manage", grants),
    canReadServicePlans: can(roles, "servicePlans.read", grants),
    canManageAttendance: can(roles, "attendance.manage", grants),
    canReadAttendance: can(roles, "attendance.read", grants),
    canAssignRoles: can(roles, "roles.assign", grants),
    canManageSystem: can(roles, "system.manage", grants),
  };
}
