"use client";

import { motion } from "framer-motion";

export default function SpotlightFive() {
  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center px-8 md:px-6 lg:px-2">

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold">Visitor Management</h2>
          <p className="text-white/70">
            Keep track of your visitors effortlessly and ensure a smooth experience.
          </p>
        </motion.div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <img
            src="/Visitor.png"
            width={600}
            height={600}
            className="rounded-xl shadow-xl w-full h-auto"
            alt="Visitor Illustration"
          />
        </motion.div>
      </div>
    </section>
  );
}
