"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebase/client";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { useToast } from "@/app/hooks/use-toast";

export default function RegionsPage() {
  const { toast } = useToast();

  const [regions, setRegions] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [regionAdminId, setRegionAdminId] = useState("");

  // Load regions
  useEffect(() => {
    const load = async () => {
      const snap = await getDocs(collection(db, "regions"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRegions(list);
    };
    load();
  }, []);

  // Create region
  const handleCreate = async () => {
    if (!name.trim()) return;

    await addDoc(collection(db, "regions"), {
      name: name.trim(),
      regionAdminId: regionAdminId || null,
      active: true,
      createdAt: serverTimestamp(),
    });

    toast({ title: "Region Created" });

    setName("");
    setRegionAdminId("");

    // Reload list
    const snap = await getDocs(collection(db, "regions"));
    setRegions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
                Admin: {r.regionAdminId || "None"}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
