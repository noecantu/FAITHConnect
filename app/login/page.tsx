"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/lib/firebase/client";
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
import { can } from "@/app/lib/auth/permissions/can";
import type { Role } from "@/app/lib/auth/permissions/roles";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Set Firebase persistence based on the toggle
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence
      );

      // 2. Sign in
      const { user } = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // 3. Create session cookie
      const idToken = await user.getIdToken(true);

      await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken, remember }),
      });

      // 4. Fetch profile
      const profileRes = await fetch("/api/users/me", {
        credentials: "include",
      });
      const profile = await profileRes.json();

      const roles = (profile.roles ?? []) as Role[];

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });

      // 5. Redirect logic
      if (can(roles, "system.manage")) {
        router.replace("/admin");
        return;
      }

      if (can(roles, "church.manage")) {
        router.replace(
          profile.churchId
            ? `/admin/church/${profile.churchId}`
            : "/onboarding/create-church"
        );
        return;
      }

      if (can(roles, "auth.login")) {
        router.replace(
          profile.churchId
            ? `/church/${profile.churchId}/user`
            : "/"
        );
        return;
      }

      router.replace("/");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "The email or password you entered is incorrect.",
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
          <CardDescription>Log in to your account</CardDescription>
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

            {/* Forgot + Remember */}
            <div className="flex items-center justify-center">
              <a
                href="/forgot-password"
                className="text-sm text-blue-400 hover:underline"
              >
                Forgot your password?
              </a>

              {/* <div className="flex items-center gap-2">
                <Switch
                  id="remember"
                  checked={remember}
                  onCheckedChange={setRemember}
                />
                <Label htmlFor="remember" className="text-sm">
                  Remember Me
                </Label>
              </div> */}
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
