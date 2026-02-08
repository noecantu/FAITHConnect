"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/app/lib/firebase";

export default function CreateChurchPage() {
  const router = useRouter();

  const [churchName, setChurchName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) {
            setError("You must be logged in to create a church.");
            setLoading(false);
            return;
            }

            // 1. Get a fresh Firebase ID token
            const token = await user.getIdToken(true);

            // 2. Call your API route with the token + church name
            const res = await fetch("/api/onboarding/create-church", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token,
                churchName,
            }),
            });

            const data = await res.json();

            if (!res.ok) {
            setError(data.error || "Something went wrong.");
            setLoading(false);
            return;
            }

            // 3. Redirect to dashboard
            router.push("/dashboard");
        } catch (err) {
            console.error(err);
            setError("Unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-slate-800/30 rounded-xl border border-slate-700">
      <h1 className="text-2xl font-semibold text-slate-100 mb-4">
        Create Your Church
      </h1>

      <p className="text-slate-300 mb-6">
        Welcome! Let’s set up your church so you can begin managing your
        community.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-300 mb-1">Church Name</label>
          <input
            type="text"
            value={churchName}
            onChange={(e) => setChurchName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:ring focus:ring-slate-600"
          />
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-slate-700 text-slate-100 hover:bg-slate-600 transition disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Church"}
        </button>
      </form>
    </div>
  );
}
