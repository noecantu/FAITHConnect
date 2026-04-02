"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth";
import { can } from "@/app/lib/auth/permissions/can";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Not logged in
    if (!user) {
      router.push("/marketing");
      return;
    }

    const roles = user.roles ?? [];

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
    if (!user.churchId) {
      router.push("/onboarding/create-church");
      return;
    }

    // Regular member → Members Page
    if (can(roles, "members.read")) {
      router.push("/members");
      return;
    }

    // Fallback
    router.push("/marketing");
  }, [user, loading, router]);

  return null;
}