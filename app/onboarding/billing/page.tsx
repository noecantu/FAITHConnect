"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/app/hooks/use-toast";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  normalizeBillingCycle,
  normalizePlanId,
  type PlanId,
} from "@/app/lib/pricing-plans";

export default function BillingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedPlan, setResolvedPlan] = useState<PlanId | null>(null);

  const planParam = searchParams.get("plan");
  const cycle = normalizeBillingCycle(searchParams.get("cycle"));

  useEffect(() => {
    // If the plan is in the URL (normal forward flow), use it directly.
    if (planParam) {
      const normalizedPlan = normalizePlanId(planParam);
      if (normalizedPlan) {
        setResolvedPlan(normalizedPlan);
      } else {
        toast({
          title: "Invalid Plan",
          description: "Please choose a valid plan before billing.",
        });
        router.replace("/onboarding/choose-plan");
      }
      return;
    }

    // If no URL param (guard-resume after re-login), try to recover from the
    // user's saved profile in Firestore via /api/users/me.
    const recover = async () => {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          const recoveredPlan = normalizePlanId(data.planId);
          if (recoveredPlan) {
            setResolvedPlan(recoveredPlan);
            return;
          }
        }
      } catch {
        // fall through
      }

      toast({
        title: "Missing Plan",
        description: "Please choose a plan before billing.",
      });
      router.replace("/onboarding/choose-plan");
    };

    recover();
  }, [planParam, router, toast]);

  const plan = resolvedPlan;

  const handleCheckout = async () => {
    if (!plan) return;

    setIsLoading(true);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle }),
      });

      if (!res.ok) throw new Error("Failed to start checkout");

      const { url } = await res.json();
      router.replace(url);
    } catch (err) {
      toast({
        title: "Billing Error",
        description: "Unable to start checkout.",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-20">

      {/* BACK BUTTON */}
      <div className="max-w-5xl mx-auto mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-white/60 hover:text-white transition"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>
      </div>

      {/* LOGO HEADER */}
      <div className="relative flex justify-center mb-6">
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="h-40 w-40 sm:h-56 sm:w-56 md:h-72 md:w-72 bg-blue-600/20 blur-3xl rounded-full"></div>
        </div>

        <img
          src="/FAITH_CONNECT_FLAME_LOGO.svg"
          alt="Faith Connect Logo"
          className="relative z-10 mx-auto h-40 w-40 sm:h-56 sm:w-56 md:h-72 md:w-72"
          draggable={false}
        />
      </div>

      {/* TAGLINE */}
      <p className="text-center text-white/60 mb-4 tracking-wide">
        Secure your ministry’s tools with a simple subscription...
      </p>

      {/* PROGRESS INDICATOR */}
      <p className="text-center text-white/40 text-sm mb-12">
        Step 4 of 4
      </p>

      <h1 className="text-4xl font-bold text-center mb-12">Billing</h1>

      <div className="max-w-md mx-auto bg-white/5 border border-white/20 backdrop-blur-sm rounded-xl p-8 shadow-lg shadow-blue-600/10">
        <p className="text-white/70 text-center mb-6">
          Complete your subscription to continue setting up your church.
        </p>
        <p className="text-white/60 text-center text-sm mb-6 capitalize">
          Billing cycle selected: {cycle}
        </p>

        <Button
          onClick={handleCheckout}
          disabled={isLoading || !plan}
          className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg rounded-xl shadow-lg shadow-blue-600/20"
        >
          {isLoading ? "Redirecting..." : "Proceed to Checkout"}
        </Button>
      </div>
    </div>
  );
}
