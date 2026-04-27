//app/(dashboard)/admin/regions/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { useToast } from "@/app/hooks/use-toast";

export default function RegionsPage() {
  const supabase = getSupabaseClient();
  const { toast } = useToast();

  const [regions, setRegions] = useState<{ id: string; name: string; state?: string; region_admin_id?: string }[]>([]);
  const [name, setName] = useState("");
  const [regionAdminId, setRegionAdminId] = useState("");
  const [state, setState] = useState("");

  async function loadRegions() {
    const { data, error } = await supabase
      .from("regions")
      .select("id, name, state, region_admin_id")
      .order("state", { ascending: true })
      .order("name", { ascending: true });
    if (error) console.error("Failed to load regions:", error);
    setRegions(data ?? []);
  }

  // Load regions on mount
  useEffect(() => {
    loadRegions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create region
  const handleCreate = async () => {
    if (!name.trim()) return;

    const { error } = await supabase.from("regions").insert({
      name: name.trim(),
      state: state.trim() || null,
      region_admin_id: regionAdminId || null,
      active: true,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Failed to create region:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Region Created" });
    setName("");
    setRegionAdminId("");
    setState("");
    await loadRegions();
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/80 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Create Region</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Region Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label>Regional Admin User ID (optional)</Label>
            <Input
              value={regionAdminId}
              onChange={(e) => setRegionAdminId(e.target.value)}
              placeholder="User ID of regional admin"
            />
          </div>

          <div className="grid gap-2">
            <Label>State</Label>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g., Texas"
            />
          </div>

          <Button onClick={handleCreate}>Create Region</Button>
        </CardContent>
      </Card>

      <Card className="bg-black/80 border-white/20 backdrop-blur-xl">
        <CardHeader>
          <CardTitle>Existing Regions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {regions.map((r) => (
            <div key={r.id} className="p-2 border border-white/10 rounded">
              <div className="font-semibold">{r.name}</div>
              <div className="text-sm text-white/60">
                Admin: {r.region_admin_id || "None"}
              </div>
              <div className="text-sm text-white/60">
                State: {r.state || "None"}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}