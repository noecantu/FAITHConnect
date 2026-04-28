"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/app/components/ui/card";
import { CheckCircle } from "lucide-react";
import {
  PRICING_PLANS,
  formatPrice,
  normalizeBillingCycle,
  type BillingCycle,
} from "@/app/lib/pricing-plans";

export default function Pricing() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    normalizeBillingCycle(null)
  );

  const handlePlanSelect = (plan: string) => {
    router.push(`/onboarding/confirm-plan?plan=${plan}&cycle=${billingCycle}`);
  };

  return (
    <section className="w-full px-6 md:px-10 xl:px-16 py-12">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <span className="block text-xs md:text-sm font-semibold tracking-[0.28em] uppercase text-blue-200/85 mb-2">
          Simple, Transparent Pricing
        </span>
        <span className="block text-4xl md:text-5xl font-extrabold leading-tight bg-gradient-to-r from-cyan-300 via-white to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(59,130,246,0.35)]">
          Available Plans
        </span>
        <span className="mx-auto mt-3 block h-1 w-28 rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-500" />
      </motion.h2>

      <div className="mb-8 flex justify-center">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PRICING_PLANS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            className={i === PRICING_PLANS.length - 1 ? "md:col-span-full" : ""}
          >
            <Card
              className={`bg-white/5 border-white/20 backdrop-blur-sm p-6 cursor-pointer interactive-card interactive-card-focus ${
                p.highlight ? "border-blue-500 shadow-lg shadow-blue-500/20" : ""
              }`}
              onClick={() => handlePlanSelect(p.id)}
            >
              <h3 className="text-2xl font-semibold mb-2">{p.name}</h3>
              <p className="text-4xl font-bold mb-2">{formatPrice(p, billingCycle)}</p>
              <p className="text-sm text-white/60 mb-6">
                {billingCycle === "monthly"
                  ? `or ${formatPrice(p, "yearly")} Billed Yearly (More Than 10% Savings)`
                  : `or ${formatPrice(p, "monthly")} Billed Monthly`}
              </p>

              <ul className="space-y-2 text-white/70">
                {p.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
