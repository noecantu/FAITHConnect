"use client";

import { motion } from "framer-motion";

export default function SpotlightTwo() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center px-6">

        {/* Image */}
        <motion.img
          src="/dashboard-members.png"
          className="rounded-xl shadow-xl order-2 md:order-1"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        />

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="order-1 md:order-2"
        >
          <h2 className="text-4xl font-bold mb-4">Manage Members With Ease</h2>
          <p className="text-white/70 mb-6">
            Keep your congregation organized and up to date with powerful member tools.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
