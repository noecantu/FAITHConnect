"use client";

import { useState } from "react";
import { AlertTriangle, CreditCard, Lock } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

interface BillingLapsedNoticeProps {
  churchName?: string;
  isAdmin?: boolean;
}

export function BillingLapsedNotice({ churchName, isAdmin = false }: BillingLapsedNoticeProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdateBilling() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Failed to open billing portal.");
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <Card className="border-amber-500/35 bg-amber-500/5 backdrop-blur-sm">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-amber-400/35 bg-amber-500/10 text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-amber-200/80">
                Subscription Status
              </p>
              <h2 className="mt-1 text-xl font-semibold text-amber-100">
                Subscription Payment Failed
              </h2>
            </div>

            <p className="text-sm text-amber-100/90">
              {churchName
                ? `${churchName}'s subscription could not be renewed.`
                : "Your church's subscription could not be renewed."}{" "}
              {isAdmin
                ? "Please update your payment method to restore full access."
                : "Please ask your church administrator to update the payment method."}
            </p>

            <div className="rounded-lg border border-amber-400/20 bg-black/25 p-3 text-sm">
              <p className="mb-2 inline-flex items-center gap-2 font-medium text-amber-200">
                <Lock className="h-4 w-4" />
                What this means right now
              </p>
              <ul className="list-disc space-y-1 pl-5 text-amber-100/80">
                <li>Access to church feature pages is currently suspended.</li>
                <li>All data is preserved and will be restored immediately on payment.</li>
                {isAdmin ? (
                  <li>Click &quot;Update Payment Method&quot; below to resolve this.</li>
                ) : (
                  <li>Only your church administrator can resolve this.</li>
                )}
              </ul>
            </div>

            {isAdmin && (
              <div className="pt-1 space-y-2">
                <Button
                  onClick={handleUpdateBilling}
                  disabled={loading}
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  {loading ? "Opening Billing Portal…" : "Update Payment Method"}
                </Button>
                {error && (
                  <p className="text-sm text-rose-300">{error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
