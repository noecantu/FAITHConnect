"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

export default function ResetEmailSentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center px-4">
      <Card className="relative w-full max-w-sm bg-black/80 border-white/20 backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <img
            src="/F-Flame_Vector_Optimized.svg"
            alt="Faith Connect Logo"
            className="mx-auto h-20 w-20"
          />
          <CardTitle>Check Your Email</CardTitle>
          <CardDescription>
            If an account exists for that email, you’ll receive a password reset
            link shortly.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-md border border-white/20 bg-white/5 p-3 text-sm text-slate-300">
            <p className="font-medium text-white">Didn't get it?</p>
            <p className="mt-1">Wait 1-2 minutes, check spam/junk, then try again.</p>
          </div>

          <Button
            className="w-full"
            onClick={() => (window.location.href = "/login")}
          >
            Return to Login
          </Button>

          <Button
            variant="ghost"
            className="w-full text-sm text-blue-500 hover:underline"
            onClick={() => (window.location.href = "/forgot-password")}
          >
            Send Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
