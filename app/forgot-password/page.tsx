"use client";

import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail, type ActionCodeSettings } from "firebase/auth";
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
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const getResetErrorMessage = (error: FirebaseError) => {
    switch (error.code) {
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      case "auth/operation-not-allowed":
        return "Password reset is not enabled in Firebase Auth (Email/Password provider).";
      case "auth/configuration-not-found":
        return "Password reset email provider is not configured in Firebase Auth.";
      default:
        return "Unable to send reset email right now. Please try again.";
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast({
        title: "Email Required",
        description: "Enter your email address to reset your password.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const actionCodeSettings: ActionCodeSettings = {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      };

      await sendPasswordResetEmail(auth, normalizedEmail, actionCodeSettings);
      router.push("/forgot-password/sent");

      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for a password reset link.",
      });

      setEmail("");
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        console.error("Reset error:", error.code, error.message);

        // For unknown accounts, keep UX consistent and avoid account enumeration.
        if (error.code === "auth/user-not-found") {
          router.push("/forgot-password/sent");
          return;
        }

        toast({
          title: "Reset Email Failed",
          description: getResetErrorMessage(error),
        });
        return;
      }

      toast({
        title: "Error",
        description: "Unable to send reset email right now. Please try again.",
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
          <CardDescription>Reset your password</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleReset} className="space-y-4">
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

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Reset Link"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm text-blue-500 hover:underline"
              onClick={() => history.back()}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
