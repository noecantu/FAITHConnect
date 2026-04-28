"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";
import { Button } from "@/app/components/ui/button";
import { normalizeBillingCycle } from "@/app/lib/pricing-plans";

export default function AdminCredentialsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const plan = searchParams.get("plan");
  const cycle = normalizeBillingCycle(searchParams.get("cycle"));
  const trial = searchParams.get("trial") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    if (!plan) {
      toast({ title: "Missing Plan", description: "Please choose a plan first." });
      router.replace("/onboarding/choose-plan");
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", description: "Please make sure both passwords are identical." });
      return;
    }

    setIsLoading(true);

    try {
      // Single server-side call: creates auth user (no confirmation email) + profile
      const res = await fetch("/api/onboarding/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, firstName, lastName, plan, cycle, trial }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409 || data.alreadyExists) {
          toast({
            title: "Account already exists",
            description: "That email is already registered. Try logging in or reset your password.",
            action: <Button onClick={() => router.push("/login")}>Go to Login</Button>,
          });
          return;
        }
        if (data.code === "SCHEMA_NOT_INITIALIZED") {
          throw new Error(data.error);
        }
        throw new Error(data.error || "Failed to create account.");
      }

      // Refresh local Supabase session from the cookie set server-side
      const supabase = getSupabaseClient();
      await supabase.auth.refreshSession();

      // Sign in client-side so the browser session cookie is established
      await supabase.auth.signInWithPassword({ email: email.trim(), password });

      toast({ title: "Account Created", description: "Continue to billing." });
      router.replace(`/onboarding/billing?plan=${plan}&cycle=${cycle}${trial ? "&trial=true" : ""}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to create your account.";
      console.error("Signup error:", error);
      toast({ title: "Signup Failed", description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-20 flex items-center justify-center">

      {/* BACK BUTTON */}
      <div className="absolute top-8 left-8">
        <Button
          type="button"
          variant="outline"
          className="bg-black/80 border-white/20 text-white/80 hover:bg-white/5"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card className="relative w-full max-w-md bg-white/5 border-white/20 backdrop-blur-xl p-8 shadow-xl">

        {/* LOGO */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <div className="h-32 w-32 bg-blue-600/20 blur-3xl rounded-full"></div>
          </div>

          <img
            src="/FAITH_CONNECT_FLAME_LOGO.svg"
            alt="FAITH Connect Logo"
            className="relative z-10 mx-auto h-48 w-48"
            draggable={false}
          />
        </div>

        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Create Your Account</CardTitle>
          <CardDescription className="text-white/60">
            Step 3 of 4 — Admin Credentials
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 mt-4">
          <form onSubmit={handleSignup} className="space-y-5">

            <div className="space-y-2">
              <label className="text-white/90">First Name</label>
              <input
                className="w-full rounded-md bg-black/80 border border-white/20 px-3 py-2 text-white"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/90">Last Name</label>
              <input
                className="w-full rounded-md bg-black/80 border border-white/20 px-3 py-2 text-white"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/90">Email</label>
              <input
                type="email"
                className="w-full rounded-md bg-black/80 border border-white/20 px-3 py-2 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/90">Password</label>
              <input
                type="password"
                className="w-full rounded-md bg-black/80 border border-white/20 px-3 py-2 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/90">Confirm Password</label>
              <input
                type="password"
                className="w-full rounded-md bg-black/80 border border-white/20 px-3 py-2 text-white"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg text-lg shadow-lg shadow-blue-600/20"
            >
              {isLoading ? "Creating..." : "Continue to Billing"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
