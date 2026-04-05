"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!sessionId) return;

    // Optional: verify session with your backend
    fetch(`/api/stripe/verify?session_id=${sessionId}`)
      .then(res => res.json())
      .then(data => setStatus(data.status || "success"))
      .catch(() => setStatus("error"));
  }, [sessionId]);

  if (status === "loading") return <p>Verifying your subscription…</p>;
  if (status === "error") return <p>Something went wrong.</p>;

  return (
    <div>
      <h1>Subscription Successful</h1>
      <p>Your plan is now active.</p>
      <p>You can close this page or continue to your dashboard.</p>
    </div>
  );
}
