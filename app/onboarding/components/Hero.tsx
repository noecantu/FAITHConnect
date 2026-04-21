"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";

export default function Hero() {
  return (
    <section className="max-w-5xl mx-auto px-8 md:px-6 lg:px-2 pb-24 text-center">

      {/* Floating Halo */}
      <div className="relative flex justify-center mb-6">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center z-0"
        >
          <div className="h-72 w-72 bg-blue-600/20 blur-3xl rounded-full"></div>
        </motion.div>

        {/* Floating Logo */}
        <motion.img
          src="/FAITH_CONNECT_FLAME_LOGO.svg"
          alt="Faith Connect Logo"
          className="relative z-10 mx-auto h-56 w-56"
          draggable={false}
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Text */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 3.0 }}
        className="text-5xl font-bold mb-6"
      >
        Church Management Made Effortless
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-lg text-white/70 max-w-2xl mx-auto mb-10"
      >
        FAITH Connect helps ministries track attendance, manage members, and stay organized — all in one beautiful, intuitive platform.
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
        className="flex flex-col items-center gap-4 max-w-xs mx-auto"
      >
        <Button asChild className="w-full px-8 py-6 text-lg bg-blue-700 hover:bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
          <Link href="/onboarding">Get Started</Link>
        </Button>

        <Button
          asChild
          variant="ghost"
          className="w-full px-8 py-6 text-lg bg-gray-700 hover:bg-gray-600 text-white rounded-xl shadow-lg shadow-grey-600/20"
        >
          <Link href="/login">Log In</Link>
        </Button>
      </motion.div>
    </section>
  );
}
