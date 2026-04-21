"use client";

import { motion } from "framer-motion";

export default function SpotlightFour() {
  return (
    <section className="py-12">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center px-8 md:px-6 lg:px-2">

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
          className="order-2 md:order-1"
        >
          <img
            src="/Set_Lists.png"
            width={600}
            height={600}
            className="rounded-xl shadow-xl w-full h-auto"
            alt="Musician Set Lists"
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
          <h2 className="text-4xl font-bold">Musician Set Lists</h2>
          <p className="text-white/70">
            Keep your music team organized with easy-to-manage set lists.
          </p>
        </motion.div>

      </div>
    </section>
  );
}
