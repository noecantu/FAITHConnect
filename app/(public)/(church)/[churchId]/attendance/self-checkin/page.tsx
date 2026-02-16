"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function SelfCheckInPage() {
  const params = useParams();
  const search = useSearchParams();

  const churchId = params.churchId as string;

  const token = search.get("t");
  const date = search.get("d");

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validate token presence
  useEffect(() => {
    if (!token || !date) {
      setError("Invalid or missing QR token.");
    }
  }, [token, date]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!code.trim()) {
      setError("Please enter your check‑in code.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/${churchId}/attendance/self-checkin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            date,
            checkInCode: code.trim(),
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Check‑in failed.");
      } else {
        setSuccess(true);
        setCode("");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">

      {/* Background gradient + vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-/40 via-slate-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_70%)]" />

      {/* Centered card */}
      <div className="relative w-full max-w-md">
        <Card className="w-full bg-slate-950 border-slate-800 shadow-xl">
          <CardHeader>
            <CardTitle className="text-center text-slate-100 text-xl">
              Self Check‑In
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* Error */}
            {error && (
              <div className="text-center text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="text-center text-sm text-green-400">
                Check‑in successful. Thank you!
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-300">
                  Check‑in Code
                </Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter your code"
                  className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100"
              >
                {loading ? "Checking..." : "Check In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
