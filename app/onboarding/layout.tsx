"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = async () => {
      // ⭐ Always allow the Choose Plan page
      if (pathname === "/onboarding") {
        setReady(true);
        return;
      }

      try {
        const res = await fetch("/api/users/me");

        // If not logged in, allow only the public onboarding steps
        if (!res.ok) {
          setReady(true);
          return;
        }

        const user = await res.json();
        const step = user.onboardingStep;

        const steps: Record<string, string> = {
          "choose-plan": "/onboarding",
          "confirm-plan": "/onboarding/confirm-plan",
          "admin-credentials": "/onboarding/admin-credentials",
          "billing": "/onboarding/billing",
          "create-church": "/onboarding/create-church",
          "done": "/admin",
        };

        const requiredPath = steps[step];

        // If user tries to access a different step, redirect
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
