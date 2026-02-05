"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth";

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // Not logged in → login
    if (!user) {
      router.push("/login");
      return;
    }

    // Root Admin → Master Admin Dashboard
    if (user.roles?.includes("RootAdmin")) {
      router.push("/admin");
      return;
    }

    // Church Admin → Church Admin Dashboard (slug-based)
    if (user.roles?.includes("Admin") && user.churchId) {
      router.push(`/admin/church/${user.churchId}`);
      return;
    }

    // New user with no church → onboarding
    if (!user.churchId) {
      router.push("/onboarding/create-church");
      return;
    }

    // Regular member → Members Page
    router.push("/members");
  }, [user, loading, router]);

  return null;
}
