"use client";

import { useEffect, useState } from "react";
;
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/hooks/use-toast";

interface Props {
  district_id: string;
}

export default function DistrictProfileCard({
  const supabase = getSupabaseClient(); district_id }: Props) {
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
    if (!district_id) return;

    const load = async () => {
      setLoading(true);
      try {
        const snap = await supabase.from("districts").select('*').eq('id', district_id).single();
        if (!snap.exists()) return;

        const data = snap.data();
        const nextName = (data.name as string | undefined) ?? "";
        const nextTitle = (data.region_admin_title as string | undefined) ?? "";
        const nextState = (data.state as string | undefined) ?? "";

        setName(nextName);
        setTitle(nextTitle);
        setState(nextState);

        setInitialName(nextName);
        setInitialTitle(nextTitle);
        setInitialState(nextState);
      } catch (error) {
        console.error("district profile load error:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [district_id]);

  const hasChanges =
    name !== initialName ||
    title !== initialTitle ||
    state !== initialState;

  async function handleSave() {
    if (!district_id || !hasChanges) return;

    setSaving(true);

    try {
      const res = await fetch("/api/district/settings/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          district_id,
          name,
          region_admin_title: title,
          state,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Failed to update district profile.");
      }

      setInitialName(name);
      setInitialTitle(title);
      setInitialState(state);

      toast({ title: "Saved", description: "District profile updated." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update district profile.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>District Profile</CardTitle>
        <CardDescription>Update district display details for easier identification.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>District Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Central District"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label>District Leader Title</Label>
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
            placeholder="e.g., Alabama"
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
