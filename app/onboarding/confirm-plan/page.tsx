"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function ConfirmPlanPage() {
  const router = useRouter();
  const params = useSearchParams();

  const plan = params.get("plan") || "Unknown Plan";
  const price = params.get("price") || "";

  const handleConfirm = () => {
    router.push(`/onboarding/admin-credentials?plan=${plan}`);
  };

  const handleBack = () => {
    router.push("/onboarding");
  };

  return (
    <div className="min-h-screen px-6 py-20">

      {/* BACK BUTTON */}
      <div className="max-w-5xl mx-auto mb-8">
        <button
          onClick={handleBack}
          className="flex items-center text-white/60 hover:text-white transition"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Plans
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
        Empowering ministries with simplicity and clarity...
      </p>

      {/* PROGRESS INDICATOR */}
      <p className="text-center text-white/40 text-sm mb-12">
        Step 2 of 3
      </p>

      <h1 className="text-4xl font-bold text-center mb-12">Confirm Your Plan</h1>

      <div className="max-w-lg mx-auto">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
          <h2 className="text-3xl font-semibold mb-2">{plan}</h2>
          {price && <p className="text-2xl text-white/70 mb-6">{price}</p>}

          <div className="flex items-start gap-3 text-white/70 mb-8">
            <CheckCircle className="h-6 w-6 text-blue-400 mt-1" />
            <p>
              This is the plan you selected. You can continue or go back to choose a different one.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg rounded-xl shadow-lg shadow-blue-600/20"
              onClick={handleConfirm}
            >
              Yes, continue
            </Button>

            <Button
              variant="outline"
              className="w-full py-6 text-lg bg-white/10 hover:bg-white/20 rounded-xl border-white/20"
              onClick={handleBack}
            >
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
