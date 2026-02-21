'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { useToast } from "@/app/hooks/use-toast";

export default function CreateChurchPage() {
  const [churchName, setChurchName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding/create-church", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ churchName }),
      });

      if (!res.ok) throw new Error("Failed to create church");

      const data = await res.json();

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
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm bg-card">
        <CardHeader className="text-center space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/FAITH_CONNECT_FLAME_LOGO.svg"
            alt="Faith Connect Logo"
            className="mx-auto h-20 w-20"
            draggable={false}
          />

          <CardTitle>Create Your Church</CardTitle>
          <CardDescription>
            Let’s set up your church so you can begin managing your community.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="churchName">Church Name</Label>
              <Input
                id="churchName"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                required
                placeholder="e.g. Grace Fellowship Church"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Church"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}