import { can } from "@/app/lib/auth/permissions";
import type { Role } from "@/app/lib/auth/roles";

type DashboardRouteParams = {
  roles?: Role[] | null;
  churchId?: string | null;
  districtId?: string | null;
  regionId?: string | null;
  onboardingComplete?: boolean | null;
  onboardingStep?: string | null;
  isSystemUser?: boolean;
  isRootAdmin?: boolean;
};

export function getDashboardRoute(params: DashboardRouteParams): string {
  const {
    roles,
    churchId = null,
    onboardingComplete,
    onboardingStep,
    isSystemUser = false,
    isRootAdmin = false,
  } = params;
  const normalizedRoles = roles ?? [];

  if (isSystemUser || isRootAdmin || can(normalizedRoles, "system.manage")) {
    return "/admin";
  }

  if (normalizedRoles.includes("DistrictAdmin")) {
    return "/admin/district";
  }

  if (normalizedRoles.includes("RegionalAdmin")) {
    return "/admin/regional";
  }

  if (onboardingComplete === false) {
    const safeOnboardingStep =
      onboardingStep === "billing" && !churchId
        ? "choose-plan"
        : onboardingStep;

    const onboardingStepPaths: Record<string, string> = {
      "choose-plan": "/onboarding/choose-plan",
      "confirm-plan": "/onboarding/confirm-plan",
      "admin-credentials": "/onboarding/admin-credentials",
      billing: "/onboarding/billing",
      "create-church": "/onboarding/create-church",
    };

    return onboardingStepPaths[safeOnboardingStep ?? ""] ?? "/onboarding/choose-plan";
  }

  if (churchId) {
    if (can(normalizedRoles, "church.manage")) {
      return `/admin/church/${churchId}`;
    }

    return `/church/${churchId}/user`;
  }

  return "/onboarding/create-church";
}