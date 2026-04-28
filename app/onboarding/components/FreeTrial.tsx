"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Card } from "@/app/components/ui/card";

const perks = [
  "Full access to all features",
  "Set up your church in minutes",
  "Charged after the trial ends",
  "Cancel anytime",
];

export default function FreeTrial() {
  const router = useRouter();

  return (
    <section className="w-full px-6 md:px-10 xl:px-16 py-12">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <span className="block mt-4 pb-1 text-3xl md:text-5xl font-extrabold leading-[1.1] bg-gradient-to-r from-cyan-200 via-white to-blue-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(56,189,248,0.35)]">
          Try Before You Buy
        </span>
        <span className="mx-auto mt-3 block h-1 w-28 rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-500" />
      </motion.h2>

      <div className="flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          whileHover={{ scale: 1.03 }}
          className="w-full"
        >
          <Card
            className="rounded-2xl border border-blue-300/20 bg-gradient-to-r from-blue-900/35 via-slate-900/30 to-cyan-900/35 backdrop-blur-sm px-16 md:px-10 py-8 text-center interactive-card interactive-card-focus flex flex-col justify-center items-center min-h-[320px] cursor-pointer"
            onClick={() => router.push("/onboarding/choose-plan?trial=true")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                router.push("/onboarding/choose-plan?trial=true");
              }
            }}
            role="button"
            tabIndex={0}
          >
            <span className="inline-block rounded-full border border-cyan-300/35 bg-cyan-300/10 px-4 py-1 text-[11px] md:text-xs font-semibold tracking-[0.24em] uppercase text-cyan-100/90 mb-6 mx-auto">
              Free Trial
            </span>
            <p className="text-2xl text-white/70 mb-6">
              Get 30 days of full access — completely free.
            </p>

            <ul className="inline-flex flex-col items-start gap-3 text-white/80 mx-auto w-fit">
              {perks.map((perk) => (
                <li key={perk} className="flex items-center justify-start gap-2 text-left w-full">
                  <CheckCircle className="h-5 w-5 text-blue-400 shrink-0" />
                  {perk}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
