"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
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

export default function AdminCredentialsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const plan = searchParams.get("plan");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!plan) {
      toast({
        title: "Missing Plan",
        description: "Please choose a plan first.",
      });
      router.replace("/onboarding");
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both passwords are identical.",
      });
      setIsLoading(false);
      return;
    }

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const idToken = await user.getIdToken(true);

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email,
          firstName,
          lastName,
          roles: ["Admin"],
          churchId: null,
          plan,
          onboardingStep: "billing",
          onboardingComplete: false,
        }),
      });

      toast({
        title: "Account Created",
        description: "Continue to billing.",
      });

      router.replace(`/onboarding/billing?plan=${plan}`);
    } catch (error: any) {
      console.error("Signup error:", error);

      if (error.code === "auth/email-already-in-use") {
        toast({
          title: "Account already exists",
          description: "Try logging in instead.",
          action: (
            <Button onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          ),
        });
      } else {
        toast({
          title: "Signup Failed",
          description: "Unable to create your account.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black px-6 py-20 flex items-center justify-center">

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

      <Card className="relative w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl p-8 shadow-xl">

        {/* LOGO */}
        <div className="relative flex justify-center mb-6">
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <div className="h-32 w-32 bg-blue-600/20 blur-3xl rounded-full"></div>
          </div>

          <img
            src="/FAITH_CONNECT_FLAME_LOGO.svg"
            alt="FAITH Connect Logo"
            className="relative z-10 mx-auto h-24 w-24"
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
              <label className="text-zinc-300">First Name</label>
              <input
                className="w-full rounded-md bg-black/20 border border-white/10 px-3 py-2 text-white"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-300">Last Name</label>
              <input
                className="w-full rounded-md bg-black/20 border border-white/10 px-3 py-2 text-white"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-300">Email</label>
              <input
                type="email"
                className="w-full rounded-md bg-black/20 border border-white/10 px-3 py-2 text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-300">Password</label>
              <input
                type="password"
                className="w-full rounded-md bg-black/20 border border-white/10 px-3 py-2 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-zinc-300">Confirm Password</label>
              <input
                type="password"
                className="w-full rounded-md bg-black/20 border border-white/10 px-3 py-2 text-white"
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
