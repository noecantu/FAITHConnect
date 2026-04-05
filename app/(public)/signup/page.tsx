"use client";

import { useEffect, useState } from "react";
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
import { useToast } from "@/app/hooks/use-toast";
import { can } from "@/app/lib/auth/permissions/can";
import type { Role } from "@/app/lib/auth/permissions/roles";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  // Save Stripe session_id in a cookie so user can resume signup later
  useEffect(() => {
    if (sessionId) {
      document.cookie = `stripe_session_id=${sessionId}; path=/; max-age=86400`; 
    }
  }, [sessionId]);

  const [isChecking, setIsChecking] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // ---------------------------------------
  // 1. VERIFY STRIPE SESSION BEFORE SIGNUP
  // ---------------------------------------
  useEffect(() => {
    if (!sessionId) {
      router.replace("/onboarding/billing");
      return;
    }

    fetch(`/api/stripe/verify?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "paid") {
          setIsVerified(true);
          setSubscriptionId(data.subscription ?? null);
        } else {
          router.replace("/onboarding/billing");
        }
      })
      .catch(() => router.replace("/onboarding/billing"))
      .finally(() => setIsChecking(false));
  }, [sessionId, router]);

  // Loading screen while verifying
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Verifying your subscription…</p>
      </div>
    );
  }

  // If not verified, redirect will happen
  if (!isVerified) return null;

  // ---------------------------------------
  // 2. HANDLE SIGNUP AFTER VERIFICATION
  // ---------------------------------------
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

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

      // Create session cookie
      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      // Create Firestore profile WITH subscription ID
      await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email,
          firstName,
          lastName,
          roles: ["Admin"] satisfies Role[],
          churchId: null,
          subscriptionId,
        }),
      });

      // ⭐ Clear the Stripe session cookie now that signup is complete
      document.cookie = "stripe_session_id=; path=/; max-age=0";

      const profileRes = await fetch("/api/users/me");
      const profile = await profileRes.json();
      const roles = (profile.roles ?? []) as Role[];

      toast({
        title: "Account Created",
        description: "Welcome to FAITH Connect!",
      });

      // Redirect based on permissions
      if (can(roles, "system.manage")) {
        router.replace("/admin");
        return;
      }

      if (can(roles, "church.manage")) {
        if (profile.churchId) {
          router.replace(`/admin/church/${profile.churchId}`);
        } else {
          router.replace("/onboarding/create-church");
        }
        return;
      }

      if (can(roles, "members.read")) {
        router.replace("/members");
        return;
      }

      router.replace("/");

    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Signup Failed",
        description: "Unable to create your account.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------
  // 3. RENDER SIGNUP FORM
  // ---------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center px-4">
      <Card className="relative w-full max-w-sm bg-black/30 border-white/10 backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <img
            src="/FAITH_Connect_FLAME_LOGO.svg"
            alt="FAITH Connect Logo"
            className="mx-auto h-20 w-20"
          />
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>Start Your Church on FAITH Connect</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
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
              className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-md"
            >
              {isLoading ? "Creating..." : "Create Account"}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
