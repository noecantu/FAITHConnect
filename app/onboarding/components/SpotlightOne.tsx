"use client";

import { motion } from "framer-motion";

export default function SpotlightOne() {
  return (
    <section className="py-12">
      <div className="w-full grid md:grid-cols-2 gap-8 items-center px-6 md:px-10 xl:px-16">

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold">Track Attendance Effortlessly</h2>
          <p className="text-white/70">
            Scan QR codes, view real-time check-ins, and keep your church attendance organized.
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
            src="/Attendance.png"
            width={600}
            height={600}
            className="rounded-xl shadow-xl w-full h-auto"
            alt="Attendance Dashboard"
          />
        </motion.div>
      </div>
    </section>
  );
}
