"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import { PageHeader } from "@/app/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/hooks/use-toast";

export default function EditChurchPage() {
  const params = useParams();
  const churchIdRaw = params?.churchId;

  // Normalize
  const churchIdStr = Array.isArray(churchIdRaw)
    ? churchIdRaw[0]
    : churchIdRaw;

  // Hard guard
  if (!churchIdStr || typeof churchIdStr !== "string") {
    console.error("Invalid churchId param");
    return null;
  }

  // ⭐ Create a NEW constant that TS knows is ALWAYS a string
  const churchIdSafe: string = churchIdStr;

  const router = useRouter();
  const { toast } = useToast();

  const [church, setChurch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!churchIdSafe) return;

    const load = async () => {
      const ref = doc(db, "churches", churchIdSafe);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        console.error("Church not found");
        return;
      }

      const data = snap.data();
      setChurch(data);

      setName(data.name || "");
      setTimezone(data.timezone || "");
      setLogoUrl(data.logoUrl || "");
      setDescription(data.description || "");

      setLoading(false);
    }

    load();
  }, [churchIdSafe]);

  async function handleSave() {
    try {
      const ref = doc(db, "churches", churchIdSafe);

      await updateDoc(ref, {
        name,
        timezone,
        logoUrl,
        description,
        updatedAt: new Date().toISOString(),
      });

      toast({
        title: "Church Updated",
        description: "The church details have been saved successfully.",
      });

      router.push(`/admin/churches/${churchIdStr}`);
    } catch (err) {
      console.error("Failed to update church:", err);
      toast({
        title: "Error",
        description: "Could not update church.",
        variant: "destructive",
      });
    }
  }

  if (loading || !church) {
    return (
      <div className="flex justify-center items-center min-h-screen text-foreground">
        Loading church…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title={`Edit: ${church.name}`}
        subtitle="Modify system-level church details"
      />

      <Card>
        <CardHeader>
          <CardTitle>Church Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* Name */}
          <div className="space-y-2">
            <Label>Church Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Church Name"
            />
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label>Timezone</Label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a timezone</option>

              <optgroup label="United States">
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="America/Phoenix">Arizona (No DST)</option>
                <option value="America/Anchorage">Alaska</option>
                <option value="Pacific/Honolulu">Hawaii</option>
              </optgroup>

              <optgroup label="International">
                <option value="Europe/London">London (UK)</option>
                <option value="Europe/Paris">Paris (France)</option>
                <option value="Europe/Berlin">Berlin (Germany)</option>
                <option value="Asia/Tokyo">Tokyo (Japan)</option>
                <option value="Asia/Singapore">Singapore</option>
                <option value="Australia/Sydney">Sydney (Australia)</option>
              </optgroup>
            </select>
          </div>

          {/* Logo URL */}
          <div className="space-y-2">
            <Label>Logo URL</Label>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of the church"
            />
          </div>

          {/* Save Button */}
          <Button className="w-full mt-4" onClick={handleSave}>
            Save Changes
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
