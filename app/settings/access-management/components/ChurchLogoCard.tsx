'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { useToast } from '@/app/hooks/use-toast';

import { db, storage } from '@/app/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface Props {
  churchId: string;
  churchName: string;
}

export default function ChurchLogoCard({ churchId, churchName }: Props) {
  const { toast } = useToast();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const hasChanges = logoUrl !== originalLogoUrl;
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  function getInitials(name: string | null | undefined) {
    if (!name) return "??";
    return name
      .split(" ")
      .map((w) => w[0]?.toUpperCase())
      .join("")
      .slice(0, 2);
  }

  // Load existing logo
  useEffect(() => {
    if (!churchId) return;

    const load = async () => {
      const snap = await getDoc(doc(db, 'churches', churchId));
      if (snap.exists()) {
        const url = snap.data().logoUrl ?? null;
        setLogoUrl(url);
        setOriginalLogoUrl(url);
      }
    };

    load();
  }, [churchId]);

  // Upload handler
  const handleUpload = async (file: File) => {
    if (!churchId) return;

    setUploading(true);

    try {
      if (!churchId) throw new Error("Missing churchId");
      if (!file) throw new Error("No file selected");

      // Always include a filename + extension to avoid CORS + metadata issues
      const ext = file.name.split(".").pop() || "png";
      const storageRef = ref(storage, `churches/${churchId}/logo/logo.${ext}`);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setLogoUrl(url);

      toast({
        title: "Logo uploaded",
        description: "Preview updated.",
      });
    } catch (err: unknown) {
      let message = "Something went wrong.";

      if (err instanceof Error) {
        message = err.message;
      }

      toast({
        title: "Upload failed",
        description: message,
      });
    } finally {
      setUploading(false);
    }
  };

  // Save handler
  const handleSave = async () => {
    if (!churchId || !hasChanges) return;

    setSaving(true);

    try {
      await updateDoc(doc(db, "churches", churchId), {
        logoUrl,
        updatedAt: new Date(),
      });

      setOriginalLogoUrl(logoUrl);

      toast({
        title: "Saved",
        description: "Church logo updated.",
      });
    } catch (err: unknown) {
      let message = "Something went wrong.";

      if (err instanceof Error) {
        message = err.message;
      }

      toast({
        title: "Error",
        description: message,
      });
    } finally {
      setSaving(false);
    }
  };

  // Remove logo handler
  const handleRemove = async () => {
  if (!churchId || !logoUrl) return;

  setRemoving(true);

  try {
    const storageRef = ref(storage, `churches/${churchId}/logo`);
      await deleteObject(storageRef);

      setLogoUrl(null);

      await updateDoc(doc(db, "churches", churchId), {
        logoUrl: null,
        updatedAt: new Date(),
      });

      toast({
        title: "Logo removed",
        description: "The church logo has been deleted.",
      });
    } catch (err: unknown) {
      let message = "Something went wrong.";

      if (err instanceof Error) {
        message = err.message;
      }

      toast({
        title: "Error",
        description: message,
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Church Logo</CardTitle>
        <CardDescription>Upload and manage your church’s logo.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Preview */}
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Church Logo"
            className="h-32 w-32 rounded-md object-cover border border-border bg-white ring-2 ring-primary/20 shadow-md"
          />
        ) : (
          <div
            className="
              h-20 w-20 rounded-full
              bg-muted flex items-center justify-center
              text-xl font-semibold text-muted-foreground
              border
            "
          >
            {getInitials(churchName)}
          </div>
        )}

        {/* Upload */}
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving || uploading}
            className="w-full sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>

          <Button
            variant="destructive"
            onClick={() => setShowConfirmRemove(true)}
            disabled={!logoUrl || removing}
            className="w-full sm:w-auto"
          >
            Remove Logo
          </Button>
        </div>

        {showConfirmRemove && (
          <div className="border border-red-300 bg-red-50 rounded-md p-4 space-y-3">
            <p className="text-sm text-red-800">
              Are you sure you want to remove the church logo? This action cannot be undone.
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
                {removing ? 'Removing...' : 'Confirm Remove'}
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
