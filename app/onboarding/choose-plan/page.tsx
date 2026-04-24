// app/onboarding/choose-plan/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/app/components/ui/card";
import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import {
  PRICING_PLANS,
  formatPrice,
  normalizeBillingCycle,
  type BillingCycle,
} from "@/app/lib/pricing-plans";

export default function OnboardingChoosePlan() {
  const searchParams = useSearchParams();
  const trial = searchParams.get("trial") === "true";
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    normalizeBillingCycle(null)
  );

  return (
    <div className="min-h-screen px-6 py-20">

      {/* BACK BUTTON */}
      <div className="max-w-5xl mx-auto mb-8">
        <Link href="/" className="flex items-center text-white/60 hover:text-white transition">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Website
        </Link>
      </div>

      {/* LOGO HEADER */}
      <div className="relative flex justify-center mb-6">
        {/* Glowing halo */}
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
        Step 1 of 3
      </p>

      <h1 className="text-4xl font-bold text-center mb-12">Choose Your Plan</h1>

      <div className="max-w-5xl mx-auto mb-8 flex justify-center">
        <div className="inline-flex rounded-xl border border-white/20 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              billingCycle === "monthly" ? "bg-blue-600 text-white" : "text-white/70 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              billingCycle === "yearly" ? "bg-blue-600 text-white" : "text-white/70 hover:text-white"
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {PRICING_PLANS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
          >
            <Card
              className={`bg-white/5 border-white/20 backdrop-blur-sm p-6 cursor-pointer interactive-card interactive-card-focus ${
                p.highlight ? "border-blue-500 shadow-lg shadow-blue-500/20" : ""
              }`}
              onClick={() => {
                window.location.href = `/onboarding/confirm-plan?plan=${p.id}&cycle=${billingCycle}${trial ? "&trial=true" : ""}`;
              }}
            >
              <h3 className="text-2xl font-semibold mb-2">{p.name}</h3>
              <p className="text-4xl font-bold mb-2">{formatPrice(p, billingCycle)}</p>
              <p className="text-sm text-white/60 mb-6">
                {billingCycle === "monthly"
                  ? `or ${formatPrice(p, "yearly")} billed yearly`
                  : `or ${formatPrice(p, "monthly")} billed monthly`}
              </p>

              <ul className="space-y-2 mb-6 text-white/70">
                {p.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="text-center text-sm font-semibold text-blue-400 hover:text-blue-300">
                Choose {p.name}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
