"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/hooks/use-toast";
import { Check, X } from "lucide-react";
import ImageDropzone from "@/app/components/settings/ImageDropzone";

interface Props {
  region_id: string;
  regionName: string;
}

export default function RegionLogoCard({
  region_id,
  regionName,
}: Props) {
  const supabase = getSupabaseClient();
  const { toast } = useToast();

  const [logo_url, setLogoUrl] = useState<string | null>(null);
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null);
  const [uploadPath, setUploadPath] = useState(`regions/${region_id}/logo/logo-${Date.now()}.png`);

  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const hasChanges = logo_url !== originalLogoUrl;

  useEffect(() => {
    if (!region_id) return;

    setUploadPath(`regions/${region_id}/logo/logo-${Date.now()}.png`);

    const load = async () => {
      const { data } = await supabase.from("regions").select('*').eq('id', region_id).single();
      if (!data) return;

      const url = (data.logo_url as string | null | undefined) ?? null;
      setLogoUrl(url);
      setOriginalLogoUrl(url);
    };

    load();
  }, [region_id]);

  async function uploadLogoViaApi(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("region_id", region_id);
    formData.append("file", file);

    const res = await fetch("/api/region/logo/upload", {
      method: "POST",
      body: formData,
    });

    const data = (await res.json().catch(() => ({}))) as {
      url?: unknown;
      error?: unknown;
    };

    if (!res.ok) {
      const message = typeof data.error === "string" ? data.error : "Could not upload logo.";
      throw new Error(`${message} (HTTP ${res.status})`);
    }

    if (typeof data.url !== "string" || data.url.length === 0) {
      throw new Error("Upload succeeded but no URL was returned.");
    }

    return data.url;
  }

  async function persistLogo(nextLogoUrl: string | null) {
    const res = await fetch("/api/region/settings/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region_id, logo_url: nextLogoUrl }),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      throw new Error(data.error || "Failed to update region logo.");
    }
  }

  async function handleSave() {
    if (!region_id || !hasChanges) return;

    setSaving(true);

    try {
      await persistLogo(logo_url);
      setOriginalLogoUrl(logo_url);
      toast({ title: "Saved", description: "Region logo updated." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update region logo.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!region_id || !logo_url) return;

    setRemoving(true);

    try {
      const removedLogoUrl = logo_url;
      await persistLogo(null);

      setLogoUrl(null);
      setOriginalLogoUrl(null);
      setShowConfirmRemove(false);

      try {
        const decodedPath = decodeURIComponent(removedLogoUrl.split("/o/")[1].split("?")[0]);
        await deleteObject(ref(storage, decodedPath));
      } catch (storageError) {
        console.warn("Logo file cleanup skipped:", storageError);
      }

      toast({ title: "Logo removed", description: "The region logo has been removed." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not remove region logo.",
      });
    } finally {
      setRemoving(false);
    }
  }

  function getInitials(name: string) {
    if (!name) return "RE";
    return name
      .split(" ")
      .map((word) => word[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
  }

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Region Logo</CardTitle>
            <CardDescription>Upload and manage your region logo for fast identification.</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirmRemove(true)}
              disabled={!logo_url || removing}
              className={`
                p-2 rounded-md border bg-muted/20 transition
                focus:outline-none focus:ring-2 focus:ring-primary
                ${!logo_url || removing ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"}
              `}
            >
              {removing ? (
                <div className="h-5 w-5 animate-spin border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <X className="h-5 w-5 text-white" />
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`
                p-2 rounded-md border bg-muted/20 transition
                focus:outline-none focus:ring-2 focus:ring-primary
                ${!hasChanges || saving ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"}
              `}
            >
              {saving ? (
                <div className="h-5 w-5 animate-spin border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <Check className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-center">
          {logo_url ? (
            <img
              src={logo_url}
              alt="Region Logo"
              className="h-40 w-40 rounded-md object-cover border border-border bg-white shadow-md"
            />
          ) : (
            <div className="h-40 w-40 rounded-md bg-muted flex items-center justify-center text-xl font-semibold text-muted-foreground border border-border">
              {getInitials(regionName)}
            </div>
          )}
        </div>

        <ImageDropzone
          label="Upload Region Logo"
          path={uploadPath}
          uploadHandler={uploadLogoViaApi}
          onUploaded={(url) => {
            setLogoUrl(url);
            setUploadPath(`regions/${region_id}/logo/logo-${Date.now()}.png`);
            toast({
              title: "Logo uploaded",
              description: "Preview updated. Click the checkmark to save.",
            });
          }}
          onError={(error) => {
            toast({
              title: "Upload failed",
              description: error.message || "Could not upload logo.",
            });
          }}
        />

        {showConfirmRemove && (
          <div className="border border-red-500 bg-red-50 rounded-md p-4 space-y-3">
            <p className="text-sm text-red-800">
              Are you sure you want to remove the region logo? This action cannot be undone.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmRemove(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={handleRemove}
                disabled={removing}
                className="w-full sm:w-auto"
              >
                {removing ? "Removing..." : "Confirm Remove"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
