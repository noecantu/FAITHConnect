"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function BillingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) return;

    // Optional: verify the session before redirecting
    fetch(`/api/stripe/verify?session_id=${sessionId}`)
      .then(res => res.json())
      .then(() => {
        // Redirect to signup after verification
        router.replace("/signup");
      })
      .catch(() => {
        // Even if verification fails, still redirect to signup
        router.replace("/signup");
      });
  }, [sessionId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Subscription Successful</h1>
        <p>Your plan is now active.</p>
        <p>Redirecting you to create your account…</p>
      </div>
    </div>
  );
}
