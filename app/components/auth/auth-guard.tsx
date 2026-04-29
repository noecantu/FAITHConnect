//app/components/auth
"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useChurchId } from "@/app/hooks/useChurchId";
import { getDashboardRoute } from "@/app/lib/auth/dashboardRoute";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { NON_CHURCH_ROLE_LIST } from "@/app/lib/auth/roles";

const PUBLIC_ROUTES = ["/login"];
const ONBOARDING_ROUTES = ["/select-church", "/onboarding/create-church"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { churchId, loading: churchLoading } = useChurchId();

  const router = useRouter();
  const pathname = usePathname();

  const hasRedirected = useRef(false);
  const [redirecting, setRedirecting] = useState(false);

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isOnboardingRoute = ONBOARDING_ROUTES.includes(pathname);

  const isNonChurchAdmin =
    user?.roles?.some((r) => NON_CHURCH_ROLE_LIST.includes(r)) ?? false;

  useEffect(() => {
    if (authLoading) return;
    if (!isNonChurchAdmin && churchLoading) return;
    if (hasRedirected.current) return;

    const targetRoute = user
      ? getDashboardRoute({
          roles: user.roles,
          churchId: churchId ?? user.churchId,
          districtId: user.districtId,
          regionId: user.regionId,
          onboardingComplete: user.onboardingComplete,
          onboardingStep: user.onboardingStep,
          isSystemUser:
            (user as unknown as { isSystemUser?: boolean; isRootAdmin?: boolean }).isSystemUser === true,
          isRootAdmin:
            (user as unknown as { isSystemUser?: boolean; isRootAdmin?: boolean }).isRootAdmin === true,
        })
      : null;

    // 1. Not logged in → trying to access protected route
    if (!user && !isPublic) {
      hasRedirected.current = true;
      setRedirecting(true);
      router.replace("/login");
      return;
    }

    // 2. Logged in → visiting login page
    if (user && isPublic && targetRoute) {
      hasRedirected.current = true;
      setRedirecting(true);
      router.replace(targetRoute);
      return;
    }

    // 3. Logged-in users landing on root or the wrong onboarding route → dashboard
    if (
      user &&
      targetRoute &&
      (pathname === "/" ||
        (targetRoute.startsWith("/onboarding/") && pathname.startsWith("/onboarding/") && !pathname.startsWith(targetRoute)))
    ) {
      hasRedirected.current = true;
      setRedirecting(true);
      router.replace(targetRoute);
      return;
    }

    // 4. Church users without church → onboarding
    if (user && !isNonChurchAdmin && !churchId) {
      if (!isOnboardingRoute) {
        hasRedirected.current = true;
        setRedirecting(true);
        router.replace("/onboarding/create-church");
      }
      return;
    }

    // 5. Church users with church → allowed
    return;
  }, [
    user,
    churchId,
    authLoading,
    churchLoading,
    pathname,
    isPublic,
    isNonChurchAdmin,
    isOnboardingRoute,
    router,
  ]);

  if (authLoading || churchLoading || redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!user && isPublic) return <>{children}</>;
  if (user && isNonChurchAdmin) return <>{children}</>;
  if (user && churchId) return <>{children}</>;

  return null;
}

