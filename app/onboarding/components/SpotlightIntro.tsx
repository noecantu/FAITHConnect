"use client";

import { motion } from "framer-motion";

export default function SpotlightIntro() {
  return (
    <section className="max-w-6xl mx-auto px-8 md:px-6 lg:px-2 pt-8 pb-2">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        viewport={{ once: true }}
        className="rounded-2xl border border-blue-300/20 bg-gradient-to-r from-blue-900/35 via-slate-900/30 to-cyan-900/35 backdrop-blur-sm px-6 md:px-10 py-8 text-center"
      >
        <span className="inline-block rounded-full border border-cyan-300/35 bg-cyan-300/10 px-4 py-1 text-[11px] md:text-xs font-semibold tracking-[0.24em] uppercase text-cyan-100/90">
          Platform Highlights
        </span>

        <h2 className="mt-4 text-3xl md:text-5xl font-extrabold leading-tight bg-gradient-to-r from-cyan-200 via-white to-blue-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(56,189,248,0.35)]">
          Ministry Tools. One Powerful Church Workflow.
        </h2>

        <p className="mt-4 text-white/75 max-w-2xl mx-auto text-sm md:text-base">
          See how FAITH Connect streamlines the day-to-day work of ministry teams, from check-ins to service planning.
        </p>

        <div className="mx-auto mt-6 h-1 w-32 rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-500" />
      </motion.div>
    </section>
  );
}