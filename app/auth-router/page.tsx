//app.page.tsx
"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { can } from "@/app/lib/auth/permissions";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // ---------------------------------------
    // PUBLIC ROUTES (NO REDIRECT)
    // ---------------------------------------
    if (
      pathname.startsWith("/signup") ||
      pathname.startsWith("/onboarding/billing") // includes /billing and /billing/success
    ) {
      return;
    }

    // ---------------------------------------
    // NOT LOGGED IN → SEND TO MARKETING
    // ---------------------------------------
    if (!user) {
      router.push("/");
      return;
    }

    const roles = user.roles ?? [];

    // ---------------------------------------
    // ROLE-BASED REDIRECTS
    // ---------------------------------------

    // Root Admin → Master Admin Dashboard
    if (can(roles, "system.manage")) {
      router.push("/admin");
      return;
    }

    // Church Admin → Church Admin Dashboard (slug-based)
    if (can(roles, "church.manage") && user.churchId) {
      router.push(`/admin/church/${user.churchId}`);
      return;
    }

    // New user with no church → onboarding
    if (!user.churchId && !pathname.startsWith("/onboarding")) {
      router.push("/onboarding/create-church");
      return;
    }

    // Regular member → Members Page
    if (can(roles, "members.read")) {
      router.push("/members");
      return;
    }

    // Fallback
    router.push("/");
  }, [user, loading, pathname, router]);

  return null;
}
