"use client";

import { useAuth } from "../../hooks/useAuth";
import { useChurchId } from "../../hooks/useChurchId";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { SYSTEM_ROLES, SystemRole } from "@/app/lib/system-roles";

const PUBLIC_ROUTES = ["/login"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { churchId, loading: churchLoading } = useChurchId();

  const router = useRouter();
  const pathname = usePathname();

  const hasRedirected = useRef(false);
  const [redirecting, setRedirecting] = useState(false);

  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // ⭐ System-level users (RootAdmin, etc.)
  const isSystemUser =
    user?.roles?.some((r) => SYSTEM_ROLES.includes(r as SystemRole)) ?? false;
console.log("AuthGuard user:", user);
console.log("AuthGuard roles:", user?.roles);
console.log("AuthGuard isSystemUser:", isSystemUser);
console.log("AuthGuard churchId:", churchId);
console.log("AuthGuard pathname:", pathname);

  useEffect(() => {
    // ⭐ Never run guard logic until auth is fully loaded
    if (authLoading) return;

    // ⭐ Only load churchId AFTER we know the user
    if (!isSystemUser && churchLoading) return;

    if (hasRedirected.current) return;

    //
    // 1. NOT LOGGED IN → protected route
    //
    if (!user && !isPublic) {
      hasRedirected.current = true;
      setRedirecting(true);
      router.replace("/login");
      return;
    }

    //
    // 2. LOGGED IN → login page
    //
    if (user && isPublic) {
      hasRedirected.current = true;
      setRedirecting(true);
      router.replace("/");
      return;
    }

    //
    // 3. SYSTEM USERS (RootAdmin) → always allowed, no churchId required
    //
    if (user && isSystemUser) {
      // If landing on "/", send to /admin
      if (pathname === "/") {
        hasRedirected.current = true;
        setRedirecting(true);
        router.replace("/admin");
      }
      return;
    }

    //
    // 4. CHURCH USERS WITHOUT CHURCH → onboarding
    //
    if (user && !isSystemUser && !churchId) {
      hasRedirected.current = true;
      setRedirecting(true);
      router.replace("/select-church");
      return;
    }

    //
    // 5. CHURCH USERS WITH CHURCH → allowed
    //
    return;
  }, [
    user,
    churchId,
    authLoading,
    churchLoading,
    pathname,
    isPublic,
    isSystemUser,
    router,
  ]);

  //
  // Unified loading gate
  //
  if (authLoading || churchLoading || redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  //
  // Public route allowed when logged out
  //
  if (!user && isPublic) return <>{children}</>;

  //
  // System users always allowed
  //
  if (user && isSystemUser) return <>{children}</>;

  //
  // Church users allowed only when churchId is ready
  //
  if (user && churchId) return <>{children}</>;

  //
  // Fallback (should never hit)
  //
  return null;
}
