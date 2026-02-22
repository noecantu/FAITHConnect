"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { useChurchId } from "@/app/hooks/useChurchId";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { SYSTEM_ROLES, SystemRole } from "@/app/lib/system-roles";

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

  const isSystemUser =
    user?.roles?.some((r) => SYSTEM_ROLES.includes(r as SystemRole)) ?? false;

  useEffect(() => {
    if (authLoading) return;
    if (!isSystemUser && churchLoading) return;
    if (hasRedirected.current) return;

    // 1. Not logged in → protected route
    if (!user && !isPublic) {
      hasRedirected.current = true;
      setRedirecting(true);
      router.replace("/login");
      return;
    }

    // 2. Logged in → login page
    if (user && isPublic) {
      hasRedirected.current = true;
      setRedirecting(true);
      router.replace("/");
      return;
    }

    // 3. System users (RootAdmin)
    if (user && isSystemUser) {
      if (pathname === "/") {
        hasRedirected.current = true;
        setRedirecting(true);
        router.replace("/admin");
      }
      return;
    }

    // 4. Church users without church → onboarding
    if (user && !isSystemUser && !churchId) {
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
    isSystemUser,
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
  if (user && isSystemUser) return <>{children}</>;
  if (user && churchId) return <>{children}</>;

  return null;
}
