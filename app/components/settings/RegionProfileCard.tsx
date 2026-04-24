"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/hooks/use-toast";

interface Props {
  regionId: string;
}

export default function RegionProfileCard({ regionId }: Props) {
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [state, setState] = useState("");

  const [initialName, setInitialName] = useState("");
  const [initialTitle, setInitialTitle] = useState("");
  const [initialState, setInitialState] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!regionId) return;

    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "regions", regionId));
        if (!snap.exists()) return;

        const data = snap.data();
        const nextName = (data.name as string | undefined) ?? "";
        const nextTitle = (data.regionAdminTitle as string | undefined) ?? "";
        const nextState = (data.state as string | undefined) ?? "";

        setName(nextName);
        setTitle(nextTitle);
        setState(nextState);

        setInitialName(nextName);
        setInitialTitle(nextTitle);
        setInitialState(nextState);
      } catch (error) {
        console.error("region profile load error:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [regionId]);

  const hasChanges =
    name !== initialName ||
    title !== initialTitle ||
    state !== initialState;

  async function handleSave() {
    if (!regionId || !hasChanges) return;

    setSaving(true);

    try {
      const res = await fetch("/api/region/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionId,
          name,
          regionAdminTitle: title,
          state,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Failed to update region profile.");
      }

      setInitialName(name);
      setInitialTitle(title);
      setInitialState(state);

      toast({ title: "Saved", description: "Region profile updated." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update region profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Region Profile</CardTitle>
        <CardDescription>Update region display details for easier identification.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Region Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., West Texas Region"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label>Regional Leader Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Bishop"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label>State</Label>
          <Input
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="e.g., Texas"
            disabled={loading}
          />
        </div>

        <Button onClick={handleSave} disabled={loading || saving || !hasChanges}>
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  );
}
