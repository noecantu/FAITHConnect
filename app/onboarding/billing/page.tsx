"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";

export default function BillingPage() {
  const params = useSearchParams();
  const plan = params.get("plan") || "starter";
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);

    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });

    const { url } = await res.json();
    window.location.href = url;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-4xl font-bold mb-4">Billing Setup</h1>

      <p className="text-white/60 mb-8">
        You selected the <strong className="text-white">{plan}</strong> plan.
      </p>

      <Button
        onClick={handleCheckout}
        disabled={loading}
        className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700"
      >
        {loading ? "Redirecting..." : "Continue to Billing"}
      </Button>
    </div>
  );
}
