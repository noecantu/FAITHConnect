"use client";

import { motion } from "framer-motion";

export default function SpotlightTwo() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center px-8 md:px-6">

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 3.0 }}
          viewport={{ once: true }}
          className="order-2 md:order-1"
        >
          <img
            src="/usher-rotation.png"
            width={600}
            height={600}
            className="rounded-xl shadow-xl w-full h-auto"
            alt="Members Dashboard"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 3.0 }}
          viewport={{ once: true }}
          className="order-1 md:order-2"
        >
          <h2 className="text-4xl font-bold mb-4">Manage Usher Teams</h2>
          <p className="text-white/70 mb-6">
            Keep your congregation organized and up to date with usher team calendar rotations.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
