//app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { useToast } from "@/app/hooks/use-toast";
import { clearAuthTransition, startLoginTransition } from "@/app/hooks/useAuth";
import { getDashboardRoute } from "@/app/lib/auth/dashboardRoute";
import type { Role } from "@/app/lib/auth/roles";
import { invalidateCurrentUserCache } from "@/app/lib/currentUserCache";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    clearAuthTransition();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    startLoginTransition();

    try {
      const supabase = getSupabaseClient();

      // 1. Sign in — Supabase SSR sets the session cookie automatically
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        clearAuthTransition();
        toast({
          title: "Login Failed",
          description:
            error.message === "Invalid login credentials"
              ? "Incorrect email or password."
              : error.message,
        });
        return;
      }

      // Drop any pre-login cached profile so post-login routing uses fresh role data.
      invalidateCurrentUserCache();

      // 2. Fetch profile (roles, churchId, onboarding state)
      const profileRes = await fetch("/api/users/me", {
        credentials: "include",
      });

      if (!profileRes.ok) {
        // Session can be momentarily out of sync right after sign-in.
        // Let the centralized auth router resolve the final destination.
        router.replace("/auth-router");
        return;
      }

      const profile = await profileRes.json();

      const roles = (profile.roles ?? []) as Role[];

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      const targetRoute = getDashboardRoute({
        roles,
        churchId: profile.churchId,
        districtId: profile.districtId,
        regionId: profile.regionId,
        onboardingComplete: profile.onboardingComplete,
        onboardingStep: profile.onboardingStep,
        isSystemUser: profile.isSystemUser === true,
        isRootAdmin: profile.isRootAdmin === true,
      });

      router.replace(targetRoute);
    } catch (err) {
      clearAuthTransition();
      console.error("Login error:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black flex items-center justify-center px-4">
      <Card className="relative w-full max-w-sm bg-black/80 border-white/20 backdrop-blur-xl">
        <CardHeader className="text-center space-y-2">
          <img
            src="/F-Flame_Vector_Optimized.svg"
            alt="Faith Connect Logo"
            className="mx-auto h-20 w-20"
          />
          <CardTitle>FAITH Connect</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Forgot */}
            <div className="flex items-center justify-center">
              <a
                href="/forgot-password"
                className="text-sm text-blue-500 hover:underline"
              >
                Forgot your password?
              </a>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
