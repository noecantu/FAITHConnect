"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import ImageDropzone from "@/app/components/settings/ImageDropzone";
import { Check, X } from "lucide-react";
import { useToast } from "@/app/hooks/use-toast";
import type { AppUser } from "@/app/lib/types";

export function ProfilePhotoCard({
  user,
  onDirtyChange,
  registerSave,
}: {
  user: AppUser;
  onDirtyChange?: (dirty: boolean) => void;
  registerSave?: (fn: () => Promise<void>) => void;
}) {
  const { toast } = useToast();
  const initialPhotoUrl = user.profile_photo_url ?? user.profilePhotoUrl ?? null;
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const initials =
    (user.first_name?.[0] ??
      user.firstName?.[0] ??
      user.last_name?.[0] ??
      user.lastName?.[0] ??
      user.email?.[0] ??
      "U").toUpperCase();

  const displayName = [user.first_name ?? user.firstName, user.last_name ?? user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const dirty = photoUrl !== originalPhotoUrl;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  async function uploadProfilePhotoViaApi(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/users/profile-photo/upload", {
      method: "POST",
      body: formData,
    });

    const data = (await res.json().catch(() => ({}))) as {
      url?: unknown;
      error?: unknown;
    };

    if (!res.ok) {
      const message = typeof data.error === "string" ? data.error : "Could not upload profile photo.";
      throw new Error(`${message} (HTTP ${res.status})`);
    }

    if (typeof data.url !== "string" || data.url.length === 0) {
      throw new Error("Upload succeeded but no URL was returned.");
    }

    return data.url;
  }

  async function saveProfilePhotoUrl(profilePhotoUrl: string | null) {
    const res = await fetch("/api/users/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profilePhotoUrl }),
    });

    const data = (await res.json().catch(() => ({}))) as { error?: string };

    if (!res.ok) {
      throw new Error(data.error || "Failed to update profile photo.");
    }
  }

  const handleSave = useCallback(async () => {
    if (!dirty) return;

    setSaving(true);

    try {
      await saveProfilePhotoUrl(photoUrl);
      setOriginalPhotoUrl(photoUrl);
      toast({ title: "Saved", description: "Profile photo updated." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update profile photo.",
      });
    } finally {
      setSaving(false);
    }
  }, [dirty, photoUrl, toast]);

  const handleRemove = useCallback(async () => {
    if (!photoUrl && !originalPhotoUrl) return;

    setRemoving(true);

    try {
      await saveProfilePhotoUrl(null);

      if (originalPhotoUrl) {
        await fetch("/api/users/profile-photo/delete", {
          method: "POST",
        }).catch(() => {});
      }

      setPhotoUrl(null);
      setOriginalPhotoUrl(null);
      setShowConfirmRemove(false);
      toast({ title: "Photo removed", description: "Your profile photo has been removed." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not remove profile photo.",
      });
    } finally {
      setRemoving(false);
    }
  }, [photoUrl, originalPhotoUrl, toast]);

  useEffect(() => {
    setPhotoUrl(initialPhotoUrl);
    setOriginalPhotoUrl(initialPhotoUrl);
  }, [initialPhotoUrl]);

  useEffect(() => {
    registerSave?.(async () => {
      if (showConfirmRemove) {
        return;
      }
      await handleSave();
    });
  }, [registerSave, handleSave, showConfirmRemove]);

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Profile Photo</CardTitle>
            <CardDescription>Upload and manage your profile photo for quick identification.</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirmRemove(true)}
              disabled={!photoUrl || removing}
              className={`
                p-2 rounded-md border bg-muted/20 transition
                focus:outline-none focus:ring-2 focus:ring-primary
                ${!photoUrl || removing ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"}
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
              disabled={!dirty || saving}
              className={`
                p-2 rounded-md border bg-muted/20 transition
                focus:outline-none focus:ring-2 focus:ring-primary
                ${!dirty || saving ? "opacity-40 cursor-not-allowed" : "hover:bg-muted"}
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
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile Photo"
              className="h-40 w-40 rounded-md object-cover border border-border bg-white shadow-md"
            />
          ) : (
            <div className="h-40 w-40 rounded-md bg-muted flex items-center justify-center text-xl font-semibold text-muted-foreground border border-border">
              {(displayName || initials)
                .split(" ")
                .map((word) => word[0]?.toUpperCase())
                .join("")
                .slice(0, 2) || "U"}
            </div>
          )}
        </div>

        <ImageDropzone
          label="Upload Profile Photo"
          path={`users/${user.uid}/profile.jpg`}
          uploadHandler={uploadProfilePhotoViaApi}
          onUploaded={(url) => {
            setPhotoUrl(url);
            toast({
              title: "Photo uploaded",
              description: "Preview updated. Click the checkmark to save.",
            });
          }}
          onError={(error) => {
            toast({
              title: "Upload failed",
              description: error.message || "Could not upload profile photo.",
            });
          }}
        />

        {showConfirmRemove && (
          <div className="border border-red-500 bg-red-50 rounded-md p-4 space-y-3">
            <p className="text-sm text-red-800">
              Are you sure you want to remove your profile photo? This action cannot be undone.
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
