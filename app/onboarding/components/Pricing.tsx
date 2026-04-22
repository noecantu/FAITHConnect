"use client";

import { motion } from "framer-motion";
import { Card } from "@/app/components/ui/card";
import { CheckCircle } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$9/mo",
    features: ["Up to 50 Members", "All Core Features", "Email Support"],
  },
  {
    name: "Standard",
    price: "$19/mo",
    features: ["Up to 300 Members", "All Core Features", "Priority Email Support"],
    highlight: true,
  },
  {
    name: "Pro",
    price: "$49/mo",
    features: ["Unlimited Members", "All Core Features", "Priority Support"],
  },
];

export default function Pricing() {
  return (
    <section className="max-w-6xl mx-auto px-8 md:px-6 lg:px-2 py-12">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
