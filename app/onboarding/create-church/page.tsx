"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { useToast } from "@/app/hooks/use-toast";
import { getAuth } from "firebase/auth";
import { ArrowLeft } from "lucide-react";

export default function CreateChurchPage() {
  const [churchName, setChurchName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);

      const res = await fetch("/api/onboarding/create-church", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ churchName, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create church");
      }

      await auth.currentUser?.getIdToken(true);

      toast({
        title: "Church Created",
        description: "Your church has been successfully created.",
      });

      router.replace(`/admin/church/${data.churchId}`);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Could not create church. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-6 py-20 flex items-center justify-center">

      {/* BACK BUTTON */}
      <div className="absolute top-8 left-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-white/60 hover:text-white transition"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>
      </div>

      <Card className="relative w-full max-w-md bg-white/5 border-white/20 backdrop-blur-xl p-8 shadow-xl">

        {/* LOGO + GLOW */}
        <div className="relative flex justify-center mb-6">
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <div className="h-32 w-32 bg-blue-600/20 blur-3xl rounded-full"></div>
          </div>

          <img
            src="/FAITH_CONNECT_FLAME_LOGO.svg"
            alt="Faith Connect Logo"
            className="relative z-10 mx-auto h-24 w-24"
            draggable={false}
          />
        </div>

        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Create Your Church</CardTitle>
          <CardDescription className="text-white/60">
            Step 5 of 5 — Final Setup
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-6">
          <p className="text-white/70 text-center mb-6">
            Enter your church name. This will be used across your dashboard and reports.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="churchName" className="text-zinc-300">
                Church Name
              </Label>
              <Input
                id="churchName"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                required
                placeholder="e.g. Grace Fellowship Church"
                className="bg-black/80 border-white/20 text-white"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg text-lg shadow-lg shadow-blue-600/20"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Church"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
