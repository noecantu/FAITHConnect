"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Shield, Users, Calendar, QrCode, Music2, BarChart } from "lucide-react";

const features = [
  {
    icon: Calendar,
    iconClassName: "text-sky-500",
    title: "Events & Calendar",
    desc: "Plan, schedule, and manage church events effortlessly.",
  },
  {
    icon: Users,
    iconClassName: "text-blue-500",
    title: "Member Management",
    desc: "Keep your church organized and up to date.",
  },
  {
    icon: Shield,
    iconClassName: "text-amber-500",
    title: "Permissions",
    desc: "Control access with secure role-based permissions.",
  },
  {
    icon: QrCode,
    iconClassName: "text-cyan-500",
    title: "QR Attendance",
    desc: "Fast, accurate check-ins with auto-generated QR codes.",
  },
  {
    icon: BarChart,
    iconClassName: "text-orange-500",
    title: "Reports",
    desc: "Track attendance trends and ministry engagement.",
  },
  {
    icon: Music2,
    iconClassName: "text-emerald-500",
    title: "Song Set Lists",
    desc: "Manage and organize song sets for worship services.",
  },
];

export default function Features() {
  return (
    <section className="max-w-6xl mx-auto px-8 md:px-6 lg:px-2 py-12">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
        className="text-center mb-8"
      >
        <span className="block text-xs md:text-sm font-semibold tracking-[0.28em] uppercase text-blue-200/85 mb-2">
          Built For Ministry Teams
        </span>
        <span className="block text-4xl md:text-5xl font-extrabold leading-tight bg-gradient-to-r from-cyan-300 via-white to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(59,130,246,0.35)]">
          Features
        </span>
        <span className="mx-auto mt-3 block h-1 w-28 rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-500" />
      </motion.h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5}}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
          >
            <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <f.icon className={`h-8 w-8 mb-2 ${f.iconClassName}`} />
                <CardTitle>{f.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-white/70">{f.desc}</CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}