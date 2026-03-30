"use client";

import { useState } from "react";
import type { Church } from "@/app/lib/types";
import { Input } from "@/app/components/ui/input";

interface SelfCheckInProps {
  church: Church;
  date: string;
}

export default function SelfCheckIn({ church, date }: SelfCheckInProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function normalizePhone(value: string) {
    return value.replace(/\D/g, "").slice(0, 10);
  }

  function formatPhoneInput(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;

    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    const cleanPhone = normalizePhone(phone);
    const cleanCode = code.trim().toUpperCase();

    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10‑digit phone number.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/${church.id}/attendance/self-checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: cleanPhone,
          code: cleanCode,
          date,
        }),
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
        setPhone("");
        setLoading(false);
        return;
      }

      setSuccess("Check‑in successful. Thank you!");
      setCode("");
      setPhone("");
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
          <img
            src="/FAITH_Connect_FLAME_LOGO.svg"
            alt="Faith Connect Logo"
            className="h-40 w-40"
          />
        </div>

        <h1 className="text-2xl font-semibold text-center mb-6">
          Attendance Self Check‑In
        </h1>

        {!date ? (
          <div className="text-red-500 text-center text-sm">
            Invalid or missing QR code. Please scan again.
          </div>
        ) : (
          <div className="px-4 pb-6">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Phone Number */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium px-1">Phone Number</label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const formatted = formatPhoneInput(e.target.value);
                    setPhone(formatted);
                  }}
                  placeholder="(555) 123‑4567"
                  required
                  className="px-4 py-3 text-base"
                />
              </div>

              {/* Check-In Code */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium px-1">Check‑In Code</label>
                <Input
                  type="text"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.toUpperCase().trim())
                  }
                  placeholder="Enter your code"
                  required
                  className="px-4 py-3 text-base"
                />
              </div>

              {/* Messages */}
              {error && (
                <div className="text-red-500 text-center text-sm px-1">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-600 text-center text-sm px-1">
                  {success}
                </div>
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
