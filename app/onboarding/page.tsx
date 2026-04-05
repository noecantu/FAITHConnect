// app/onboarding/page.tsx

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import Link from "next/link";
import Image from "next/image";
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
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black px-6 py-20">

      {/* BACK BUTTON */}
      <div className="max-w-5xl mx-auto mb-8">
        <Link href="/" className="flex items-center text-white/60 hover:text-white transition">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Website
        </Link>
      </div>

      {/* LOGO + HALO */}
      <div className="relative flex justify-center mb-6">
        {/* Glowing halo */}
        <div className="absolute w-72 h-72 bg-blue-600/20 blur-3xl rounded-full z-0"></div>

        <img
          src="/FAITH_Connect_FLAME_LOGO.svg"
          alt="Faith Connect Logo"
          className="relative z-10 mx-auto h-72 w-72"
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
          <Card
            key={i}
            className={`bg-white/5 border-white/10 backdrop-blur-sm p-6 ${
              p.highlight ? "border-blue-500 shadow-lg shadow-blue-500/20" : ""
            }`}
          >
            <h3 className="text-2xl font-semibold mb-2">{p.name}</h3>
            <p className="text-4xl font-bold mb-6">{p.price}</p>

            <ul className="space-y-2 mb-6 text-white/70">
              {p.features.map((f, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-400" />
                  {f}
                </li>
              ))}
            </ul>

            <Link href={`/onboarding/billing?plan=${p.plan}`} prefetch={false}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Choose {p.name}
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
