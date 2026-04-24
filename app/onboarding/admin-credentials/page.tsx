"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/lib/firebase/client";
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
      toast({
        title: "Missing Plan",
        description: "Please choose a plan first.",
        // variant: "destructive",
      });
      router.replace("/onboarding/choose-plan");
      return;
    }

    const normalizedEmail = email.trim();
    const normalizedPassword = password;
    const normalizedConfirmPassword = confirmPassword;

    if (normalizedPassword !== normalizedConfirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both passwords are identical.",
        // variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        normalizedPassword
      );

      const idToken = await user.getIdToken(true);

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const createProfileRes = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: normalizedEmail,
          firstName,
          lastName,
          roles: ["Admin"],
          churchId: null,
          plan,
          onboardingStep: "billing",
          onboardingComplete: false,
        }),
      });

      if (!createProfileRes.ok) {
        const data = await createProfileRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to initialize onboarding profile.");
      }

      toast({
        title: "Account Created",
        description: "Continue to billing.",
      });

      router.replace(`/onboarding/billing?plan=${plan}&cycle=${cycle}`);
    } catch (error: any) {
      console.error("Signup error:", error);

      if (error.code === "auth/email-already-in-use") {
        try {
          const { user } = await signInWithEmailAndPassword(
            auth,
            normalizedEmail,
            normalizedPassword
          );

          const idToken = await user.getIdToken(true);

          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          await fetch("/api/users/update-onboarding-step", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              onboardingStep: "billing",
              onboardingComplete: false,
              planId: plan,
            }),
          });

          toast({
            title: "Account Found",
            description: "Continuing onboarding from billing.",
          });

          router.replace(`/onboarding/billing?plan=${plan}&cycle=${cycle}`);
        } catch {
          toast({
            title: "Account already exists",
            description: "That email is already registered. Try logging in or reset your password.",
            // variant: "destructive",
            action: (
              <Button onClick={() => router.push("/login")}>Go to Login</Button>
            ),
          });
        }
      } else {
        toast({
          title: "Signup Failed",
          description: "Unable to create your account.",
          // variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-20 flex items-center justify-center">

      {/* BACK BUTTON */}
      <div className="absolute top-8 left-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-white/60 hover:text-white transition"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>
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
