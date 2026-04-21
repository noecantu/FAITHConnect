"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { CheckCircle, Users, Calendar, QrCode, Shield, BarChart } from "lucide-react";

const features = [
  { icon: QrCode, title: "QR Attendance", desc: "Fast, accurate check-ins with auto-generated QR codes." },
  { icon: Users, title: "Member Management", desc: "Keep your congregation organized and up to date." },
  { icon: Calendar, title: "Events & Calendar", desc: "Plan, schedule, and manage church events effortlessly." },
  { icon: BarChart, title: "Reports", desc: "Track attendance trends and ministry engagement." },
  { icon: Shield, title: "Roles & Permissions", desc: "Control access with secure role-based permissions." },
  { icon: CheckCircle, title: "Simple Onboarding", desc: "Get started in minutes with guided setup." },
];

export default function Features() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24">
      <h2 className="text-3xl font-bold text-center mb-6">Features</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.03 }}
          >
            <Card className="bg-white/5 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <f.icon className="h-8 w-8 text-blue-500 mb-2" />
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
