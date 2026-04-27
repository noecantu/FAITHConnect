//app/onboarding/OnboardingGuard.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { can } from "@/app/lib/auth/permissions";

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (pathname === "/onboarding") {
        setReady(true);
        return;
      }

      try {
        const res = await fetch("/api/users/me");

        if (!res.ok) {
          // User is not authenticated. Allow pass-through only for pre-auth
          // steps. Redirect to login for steps that require a session.
          const protectedSteps = ["/onboarding/billing", "/onboarding/create-church"];
          if (protectedSteps.some((s) => pathname.startsWith(s))) {
            router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
          }
          setReady(true);
          return;
        }

        const user = await res.json();
        const roles = Array.isArray(user.roles) ? user.roles : [];

        if (user.isSystemUser === true || user.isRootAdmin === true) {
          router.replace("/admin");
          return;
        }

        // System users should never be forced through onboarding steps.
        if (can(roles, "system.manage")) {
          router.replace("/admin");
          return;
        }

        const step =
          user.onboardingStep === "billing" && !user.planId
            ? "choose-plan"
            : user.onboardingStep;

        const steps: Record<string, string> = {
          "choose-plan": "/onboarding/choose-plan",
          "confirm-plan": "/onboarding/confirm-plan",
          "admin-credentials": "/onboarding/admin-credentials",
          "billing": "/onboarding/billing",
          "create-church": "/onboarding/create-church",
          "done": "/admin",
        };

        const requiredPath = steps[step];

        if (requiredPath && !pathname.startsWith(requiredPath)) {
          router.replace(requiredPath);
          return;
        }

        setReady(true);
      } catch {
        setReady(true);
      }
    };

    run();
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
