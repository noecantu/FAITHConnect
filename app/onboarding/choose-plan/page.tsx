// app/onboarding/choose-plan/page.tsx
"use client";

import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$9/mo",
    features: ["Up to 50 members", "Attendance tracking", "Basic reports"],
    plan: "starter",
  },
  {
    name: "Standard",
    price: "$19/mo",
    features: ["Up to 300 members", "QR attendance", "Full reports", "User roles"],
    plan: "standard",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$49/mo",
    features: ["Unlimited members", "Advanced analytics", "Priority support"],
    plan: "pro",
  },
];

export default function OnboardingChoosePlan() {
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

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
          >
            <Card
              className={`bg-white/5 border-white/20 backdrop-blur-sm p-6 ${
                p.highlight ? "border-blue-500 shadow-lg shadow-blue-500/20" : ""
              }`}
            >
              <h3 className="text-2xl font-semibold mb-2">{p.name}</h3>
              <p className="text-4xl font-bold mb-6">{p.price}</p>

              <ul className="space-y-2 mb-6 text-white/70">
                {p.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  window.location.href = `/onboarding/confirm-plan?plan=${p.plan}&price=${p.price}`;
                }}
              >
                Choose {p.name}
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
