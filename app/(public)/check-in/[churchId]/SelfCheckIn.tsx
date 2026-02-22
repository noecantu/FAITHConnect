"use client";

import { useState } from "react";
import type { Church } from "@/app/../lib/types";

interface SelfCheckInProps {
  church: Church;
  token: string;
  date: string;
}

export default function SelfCheckIn({ church, token, date }: SelfCheckInProps) {
  // UI state
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/${church.id}/attendance/self-checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          date,
          checkInCode: code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      setSuccess("Check-in successful. Thank you!");
      setLoading(false);
    } catch (_err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-700">
        <h1 className="text-2xl font-semibold text-center mb-6 text-slate-100">
          Self Check-In
        </h1>

        {!token || !date ? (
          <div className="text-red-400 text-center text-sm">
            Invalid or missing QR code. Please scan again.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm text-slate-900">
                Check-In Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 text-slate-100 border border-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your code"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-center text-sm">{error}</div>
            )}

            {success && (
              <div className="text-green-400 text-center text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-medium transition-colors"
            >
              {loading ? "Checking..." : "Check In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}