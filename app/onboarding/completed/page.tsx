"use client";

import { Button } from "@/app/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OnboardingCompletedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black px-6 py-20 flex items-center justify-center text-white">

      {/* LOGO + GLOW */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2">
        <div className="relative flex justify-center">
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <div className="h-40 w-40 bg-blue-600/20 blur-3xl rounded-full"></div>
          </div>

          <img
            src="/FAITH_CONNECT_FLAME_LOGO.svg"
            alt="Faith Connect Logo"
            className="relative z-10 mx-auto h-24 w-24"
            draggable={false}
          />
        </div>
      </div>

      <Card className="relative w-full max-w-md bg-white/5 border-white/20 backdrop-blur-xl p-10 shadow-xl text-center">

        <CardHeader>
          <CardTitle className="text-3xl font-bold">You're All Set!</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-blue-500" />
          </div>

          <p className="text-white/70 text-lg">
            Your church has been created and your account is ready.  
            Welcome to FAITH Connect — your ministry’s new home base.
          </p>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 py-4 text-lg rounded-xl shadow-lg shadow-blue-600/20"
            onClick={() => router.replace("/admin")}
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
