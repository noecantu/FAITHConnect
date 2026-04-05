// app/(marketing)/page.tsx

import { Button } from "@/app/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { CheckCircle, Users, Calendar, QrCode, Shield, BarChart } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black">
      {/* HERO */}
      <section className="max-w-5xl mx-auto px-6 pt-32 pb-24 text-center">
        {/* LOGO HEADER */}
        <div className="relative flex justify-center mb-6">
          {/* Glowing halo */}
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <div className="h-40 w-40 sm:h-56 sm:w-56 md:h-72 md:w-72 bg-blue-600/20 blur-3xl rounded-full"></div>
          </div>

          <img
            src="/FAITH_Connect_FLAME_LOGO.svg"
            alt="Faith Connect Logo"
            className="relative z-10 mx-auto h-40 w-40 sm:h-56 sm:w-56 md:h-72 md:w-72"
            draggable={false}
          />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Church Management Made Effortless
        </h1>
        <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10">
          FAITH Connect helps ministries track attendance, manage members, and stay organized — all in one beautiful, intuitive platform.
        </p>

        <div className="flex flex-col items-center gap-4 max-w-xs mx-auto">
          <Button asChild className="w-full px-8 py-6 text-lg bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-600/20">
            <Link href="/onboarding" prefetch={false}>
              Get Started
            </Link>
          </Button>

          <Button asChild className="w-full px-8 py-6 text-lg bg-white/10 hover:bg-white/20 rounded-xl shadow-lg shadow-grey-600/20">
            <Link href="/login">
              Log In
            </Link>
          </Button>
        </div>
      </section>

      {/* FEATURES */}
      <h2 className="text-3xl font-bold text-center mb-12">Highlights</h2>
      <section className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: QrCode, title: "QR Attendance", desc: "Fast, accurate check-ins with auto-generated QR codes." },
          { icon: Users, title: "Member Management", desc: "Keep your congregation organized and up to date." },
          { icon: Calendar, title: "Events & Calendar", desc: "Plan, schedule, and manage church events effortlessly." },
          { icon: BarChart, title: "Reports", desc: "Track attendance trends and ministry engagement." },
          { icon: Shield, title: "Roles & Permissions", desc: "Control access with secure role-based permissions." },
          { icon: CheckCircle, title: "Simple Onboarding", desc: "Get started in minutes with guided setup." },
        ].map((f, i) => (
          <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardHeader>
              <f.icon className="h-8 w-8 text-blue-400 mb-2" />
              <CardTitle>{f.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-white/70">{f.desc}</CardContent>
          </Card>
        ))}
      </section>

      {/* PRICING */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center mb-12">Available Plans</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Starter",
              price: "$9/mo",
              features: ["Up to 50 members", "Attendance tracking", "Basic reports"],
              plan: "starter",
            },
            {
              name: "Standard",
              price: "$19/mo",
              features: ["Up to 300 members", "QR attendance", "Full reports", "User roles"],
              plan: "standard",
              highlight: false,
            },
            {
              name: "Pro",
              price: "$49/mo",
              features: ["Unlimited members", "Advanced analytics", "Priority support"],
              plan: "pro",
            },
          ].map((p, i) => (
            <Card
              key={i}
              className={`bg-white/5 border-white/10 backdrop-blur-sm p-6 ${
                p.highlight ? "border-blue-500 shadow-lg shadow-blue-500/20" : ""
              }`}
            >
              <h3 className="text-2xl font-semibold mb-2">{p.name}</h3>
              <p className="text-4xl font-bold mb-6">{p.price}</p>

              <ul className="space-y-2 mb-6 text-white/70">
                {p.features.map((f, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
