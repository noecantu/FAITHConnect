"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { can } from "@/app/lib/auth/permissions";

export default function AuthRouter() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || user === null) return;

    const roles = user.roles ?? [];

    // PUBLIC ROUTES
    if (
      pathname.startsWith("/signup") ||
      pathname.startsWith("/onboarding/billing")
    ) {
      return;
    }

    // ONBOARDING RESUME — check before any role-based routing.
    // If the user hasn't finished onboarding, send them to the correct step.
    if (user.onboardingComplete === false) {
      const onboardingSteps: Record<string, string> = {
        "choose-plan": "/onboarding/choose-plan",
        "confirm-plan": "/onboarding/confirm-plan",
        "admin-credentials": "/onboarding/admin-credentials",
        "billing": "/onboarding/billing",
        "create-church": "/onboarding/create-church",
      };

      const stepPath = onboardingSteps[user.onboardingStep as string];
      if (stepPath && !pathname.startsWith(stepPath)) {
        router.push(stepPath);
        return;
      }
      // Already on the correct onboarding step — let the page render.
      return;
    }

    // ADMIN ROUTES
    if (can(roles, "system.manage")) {
      router.push("/admin");
      return;
    }

    if (can(roles, "church.manage") && user.churchId) {
      router.push(`/admin/church/${user.churchId}`);
      return;
    }

    if (can(roles, "contributions.manage") && user.churchId) {
      router.push(`/church/${user.churchId}/contributions`);
      return;
    }

    if (can(roles, "members.manage") && user.churchId) {
      router.push(`/church/${user.churchId}/members`);
      return;
    }

    if (can(roles, "attendance.manage") && user.churchId) {
      router.push(`/church/${user.churchId}/attendance`);
      return;
    }

    if (can(roles, "music.manage") && user.churchId) {
      router.push(`/church/${user.churchId}/music/setlists`);
      return;
    }

    if (can(roles, "servicePlans.manage") && user.churchId) {
      router.push(`/church/${user.churchId}/service-plans`);
      return;
    }

    if (can(roles, "events.manage") && user.churchId) {
      router.push(`/church/${user.churchId}/calendar`);
      return;
    }

    // READ-ONLY USERS (THIS WAS MISSING)
    if (user.churchId) {
      router.push(`/church/${user.churchId}/members`);
      return;
    }

    // NO CHURCH YET → ONBOARDING
    if (!user.churchId && !pathname.startsWith("/onboarding")) {
      router.push("/onboarding/create-church");
      return;
    }

    // SAFE FALLBACK
    router.push("/");
  }, [user, loading, pathname, router]);

  return null;
}
