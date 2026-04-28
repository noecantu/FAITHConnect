"use client";

import { motion } from "framer-motion";

export default function SpotlightTwo() {
  return (
    <section className="py-12">
      <div className="w-full grid md:grid-cols-2 gap-8 items-center px-6 md:px-10 xl:px-16">

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
          className="order-2 md:order-1"
        >
          <img
            src="/Usher_Rotation.png"
            width={600}
            height={600}
            className="rounded-xl shadow-xl w-full h-auto"
            alt="Members Dashboard"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
          className="order-1 md:order-2"
        >
          <h2 className="text-4xl font-bold">Manage Church Teams</h2>
          <p className="text-white/70">
            Keep your church organized and up to date with team calendar rotations.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
