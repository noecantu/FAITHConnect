"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Church } from "./page";

interface SelfCheckInProps {
  church: Church;
}

export default function SelfCheckIn({ church }: SelfCheckInProps) {
  const searchParams = useSearchParams();

  // QR parameters
  const token = searchParams.get("t");
  const date = searchParams.get("d");

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

    console.log("Submitting code:", code);
    console.log("Calling API:", `/api/${church.id}/attendance/self-checkin`);

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

      console.log("API responded:", res.status);

      const data = await res.json();
      console.log("API JSON:", data);

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      setSuccess("Check-in successful. Thank you!");
      setLoading(false);
    } catch (err) {
      console.error("Check-in error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white px-4">
      <div className="w-full max-w-md bg-slate-800 p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-semibold text-center mb-4">
          Self Check-In
        </h1>

        {/* Missing QR params */}
        {!token || !date ? (
          <div className="text-red-400 text-center">
            Invalid or missing QR code. Please scan again.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm text-slate-300">
                Check-In Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring focus:ring-blue-500"
                placeholder="Enter your code"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}
            {success && (
              <div className="text-green-400 text-sm text-center">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 rounded text-white font-medium"
            >
              {loading ? "Checking..." : "Check In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
