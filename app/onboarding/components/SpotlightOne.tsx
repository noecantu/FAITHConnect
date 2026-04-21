"use client";

import { motion } from "framer-motion";

export default function SpotlightOne() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center px-8 md:px-6">

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 3.0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4">Track Attendance Effortlessly</h2>
          <p className="text-white/70 mb-6">
            Scan QR codes, view real-time check-ins, and keep your ministry organized.
          </p>
        </motion.div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 3.0 }}
          viewport={{ once: true }}
        >
          <img
            src="/dashboard-attendance.png"
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
