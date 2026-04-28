"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/hooks/use-toast";

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const plan = searchParams.get("plan");

    const updateStep = async () => {
      try {
        if (!sessionId) {
          throw new Error("Missing Stripe session id.");
        }

        const res = await fetch("/api/onboarding/complete-billing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            planId: plan ?? null,
          }),
        });

        if (!res.ok) throw new Error("Failed to update onboarding step");

        router.replace("/onboarding/create-church");
      } catch (err) {
        toast({
          title: "Error",
          description: "Unable to continue onboarding.",
        });

        const plan = searchParams.get("plan");
        const fallbackPath = plan
          ? `/onboarding/billing?plan=${encodeURIComponent(plan)}`
          : "/onboarding/billing";

        router.replace(fallbackPath);
      }
    };

    updateStep();
  }, [router, searchParams, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex flex-col items-center justify-center px-6 text-white">

      {/* LOGO + GLOW */}
      <div className="relative flex justify-center mb-10">
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="h-32 w-32 bg-blue-600/20 blur-3xl rounded-full"></div>
        </div>

        <img
          src="/FAITH_CONNECT_FLAME_LOGO.svg"
          alt="Faith Connect Logo"
          className="relative z-10 mx-auto h-24 w-24"
          draggable={false}
        />
      </div>

      <h1 className="text-3xl font-bold mb-4">Processing Your Subscription…</h1>

      <p className="text-white/60 text-center max-w-md">
        Please wait while we confirm your payment and prepare the next step of your setup.
      </p>

      {/* LOADING INDICATOR */}
      <div className="mt-10 h-10 w-10 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );
}
