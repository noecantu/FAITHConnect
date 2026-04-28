"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { getDashboardRoute } from "@/app/lib/auth/dashboardRoute";

export default function AuthRouter() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const targetRoute = getDashboardRoute({
      roles: user.roles,
      churchId: user.churchId,
      districtId: user.districtId,
      regionId: user.regionId,
      onboardingComplete: user.onboardingComplete,
      onboardingStep: user.onboardingStep,
      isSystemUser:
        (user as unknown as { isSystemUser?: boolean; isRootAdmin?: boolean }).isSystemUser === true,
      isRootAdmin:
        (user as unknown as { isSystemUser?: boolean; isRootAdmin?: boolean }).isRootAdmin === true,
    });

    // PUBLIC ROUTES
    if (
      pathname.startsWith("/signup") ||
      pathname.startsWith("/onboarding/billing")
    ) {
      return;
    }

    if (pathname === targetRoute || pathname.startsWith(`${targetRoute}/`)) {
      return;
    }

    if (targetRoute.startsWith("/onboarding/")) {
      if (!pathname.startsWith(targetRoute)) {
        router.replace(targetRoute);
      }
      return;
    }

    router.replace(targetRoute);
  }, [user, loading, pathname, router]);

  return null;
}
