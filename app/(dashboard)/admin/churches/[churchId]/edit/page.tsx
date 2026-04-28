"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";

import { PageHeader } from "@/app/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/hooks/use-toast";

import TimezoneSelect from "@/app/components/settings/TimezoneSelect";
import { Church } from "@/app/lib/types";

export default function EditChurchPage() {
  const params = useParams();
  const churchIdRaw = params?.churchId;

  const churchIdStr = Array.isArray(churchIdRaw)
    ? churchIdRaw[0]
    : churchIdRaw;

  const router = useRouter();
  const { toast } = useToast();

  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!churchIdStr || typeof churchIdStr !== "string") return;

    const load = async () => {
      const { data: raw, error } = await getSupabaseClient()
        .from("churches")
        .select("*")
        .eq("id", churchIdStr)
        .single();

      if (error || !raw) {
        console.error("Church not found");
        setLoading(false);
        return;
      }

      const churchData = raw as unknown as Church;
      setChurch(churchData);

      setName(churchData.name ?? "");
      setTimezone(churchData.timezone ?? "");
      setLogoUrl(churchData.logoUrl ?? "");
      setDescription(churchData.description ?? "");

      setLoading(false);
    };

    load();
  }, [churchIdStr]);

  const handleSave = async () => {
    if (!churchIdStr || typeof churchIdStr !== "string") {
      toast({
        title: "Invalid church ID",
        description: "Unable to save changes.",
        // variant: "destructive",
      });
      return;
    }

    try {
      await getSupabaseClient()
        .from("churches")
        .update({ name, timezone, logo_url: logoUrl, description })
        .eq("id", churchIdStr);

      toast({
        title: "Church updated",
        description: "Your changes have been saved.",
      });

      router.refresh();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error updating church",
        description: (error as Error).message || "Please try again.",
        // variant: "destructive",
      });
    }
  };

  if (!churchIdStr || typeof churchIdStr !== "string") {
    return <div>Invalid church ID</div>;
  }

  if (loading) {
    return <div>Loading…</div>;
  }

  if (!church) {
    return <div>Church not found</div>;
  }

  return (
    <>
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

          {/* Timezone (reusable component) */}
          <TimezoneSelect value={timezone} onChange={setTimezone} />

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
    </>
  );
}
