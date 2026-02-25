"use client";

import { useState } from "react";
import type { Church } from "@/app/lib/types";

interface SelfCheckInProps {
  church: Church;
  date: string;
}

export default function SelfCheckIn({ church, date }: SelfCheckInProps) {
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
        body: JSON.stringify({ code, date }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setLoading(false);
        return;
      }

      if (data.alreadyCheckedIn) {
        setSuccess("You’ve already checked in today.");
        setCode("");
        setLoading(false);
        return;
      }

      setSuccess("Check-in successful. Thank you!");
      setCode("");
      setLoading(false);
    } catch (_err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-2">
      <div className="w-full max-w-md bg-card text-card-foreground p-2 rounded-xl shadow-lg border border-border">
        
        {/* Logo */}
        <div className="flex justify-center mb-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/FAITH_CONNECT_FLAME_LOGO.svg"
            alt="Faith Connect Logo"
            className="h-40 w-40"
          />
        </div>

        <h1 className="text-2xl font-semibold text-center mb-6">
          Attendance Self Check-In
        </h1>

        {!date ? (
          <div className="text-red-500 text-center text-sm">
            Invalid or missing QR code. Please scan again.
          </div>
        ) : (
          <div className="px-4 pb-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Field Group */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium px-1">
                  Check-In Code
                </label>

                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().trim())}
                  className="w-full px-4 py-3 rounded-lg bg-input text-foreground border border-input 
                            placeholder:text-muted-foreground focus:outline-none focus:ring-2 
                            focus:ring-primary"
                  placeholder="Enter your code"
                  required
                />
              </div>

              {/* Messages */}
              {error && (
                <div className="text-red-500 text-center text-sm px-1">{error}</div>
              )}

              {success && (
                <div className="text-green-600 text-center text-sm px-1">{success}</div>
              )}

              {/* Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-primary hover:bg-primary/90 
                          disabled:bg-primary/40 text-primary-foreground font-medium 
                          transition-colors"
              >
                {loading ? "Checking..." : "Check In"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
