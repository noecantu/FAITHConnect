"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { useToast } from "@/app/hooks/use-toast";
import { Check, X } from "lucide-react";
import ImageDropzone from "@/app/components/settings/ImageDropzone";

interface Props {
  districtId: string;
  districtName: string;
}

export default function DistrictLogoCard({ districtId, districtName }: Props) {
  const { toast } = useToast();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null);
  const [uploadPath, setUploadPath] = useState(`districts/${districtId}/logo/logo-${Date.now()}.png`);

  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const hasChanges = logoUrl !== originalLogoUrl;

  useEffect(() => {
    if (!districtId) return;

    setUploadPath(`districts/${districtId}/logo/logo-${Date.now()}.png`);

    const load = async () => {
      const supabase = getSupabaseClient();
      const { data } = await supabase.from("districts").select("logo_url").eq("id", districtId).single();
      if (!data) return;

      const url = (data.logo_url as string | null | undefined) ?? null;
      setLogoUrl(url);
      setOriginalLogoUrl(url);
    };

    load();
  }, [districtId]);

  async function uploadLogoViaApi(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("districtId", districtId);
    formData.append("file", file);

    const res = await fetch("/api/district/logo/upload", {
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
    const res = await fetch("/api/district/settings/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ districtId, logoUrl: nextLogoUrl }),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      throw new Error(data.error || "Failed to update district logo.");
    }
  }

  async function handleSave() {
    if (!districtId || !hasChanges) return;

    setSaving(true);

    try {
      await persistLogo(logoUrl);
      setOriginalLogoUrl(logoUrl);
      toast({ title: "Saved", description: "District logo updated." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update district logo.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!districtId || !logoUrl) return;

    setRemoving(true);

    try {
      const removedLogoUrl = logoUrl;
      await persistLogo(null);

      setLogoUrl(null);
      setOriginalLogoUrl(null);
      setShowConfirmRemove(false);

      try {
        const supabase = getSupabaseClient();
        // Extract path from Supabase public URL: .../storage/v1/object/public/logos/path
        const urlParts = removedLogoUrl.split("/storage/v1/object/public/logos/");
        if (urlParts[1]) {
          const storagePath = decodeURIComponent(urlParts[1].split("?")[0]);
          await supabase.storage.from("logos").remove([storagePath]);
        }
      } catch (storageError) {
        console.warn("Logo file cleanup skipped:", storageError);
      }

      toast({ title: "Logo removed", description: "The district logo has been removed." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not remove district logo.",
      });
    } finally {
      setRemoving(false);
    }
  }

  function getInitials(name: string) {
    if (!name) return "DI";
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
            <CardTitle>District Logo</CardTitle>
            <CardDescription>Upload and manage your district logo for fast identification.</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirmRemove(true)}
              disabled={!logoUrl || removing}
              className={`
                p-2 rounded-md border bg-muted/20 transition
                focus:outline-none focus:ring-2 focus:ring-primary
                ${!logoUrl || removing ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"}
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
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="District Logo"
              className="h-40 w-40 rounded-md object-cover border border-border bg-white shadow-md"
            />
          ) : (
            <div className="h-40 w-40 rounded-md bg-muted flex items-center justify-center text-xl font-semibold text-muted-foreground border border-border">
              {getInitials(districtName)}
            </div>
          )}
        </div>

        <ImageDropzone
          label="Upload District Logo"
          path={uploadPath}
          uploadHandler={uploadLogoViaApi}
          onUploaded={(url) => {
            setLogoUrl(url);
            setUploadPath(`districts/${districtId}/logo/logo-${Date.now()}.png`);
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
              Are you sure you want to remove the district logo? This action cannot be undone.
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
