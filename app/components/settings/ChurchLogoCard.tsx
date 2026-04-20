'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { useToast } from '@/app/hooks/use-toast';
import { db, storage } from '@/app/lib/firebase/client';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { Check, X } from "lucide-react";
import ImageDropzone from "@/app/components/settings/ImageDropzone";

interface Props {
  churchId: string;
  churchName: string;
}

export default function ChurchLogoCard({ churchId, churchName }: Props) {
  const { toast } = useToast();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);
  const [uploadPath, setUploadPath] = useState(
    `churches/${churchId}/logo/logo-${Date.now()}.png`
  );

  const hasChanges = logoUrl !== originalLogoUrl;

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

    setUploadPath(`churches/${churchId}/logo/logo-${Date.now()}.png`);

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
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong.",
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
      const decodedPath = decodeURIComponent(
        logoUrl.split("/o/")[1].split("?")[0]
      );

      const storageRef = ref(storage, decodedPath);
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
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <div className="flex items-start justify-between w-full">
          <div>
            <CardTitle>Church Logo</CardTitle>
            <CardDescription>Upload and manage your church’s logo.</CardDescription>
          </div>

          <div className="flex items-center gap-2">

            {/* Remove Logo (X) */}
            <button
              onClick={() => setShowConfirmRemove(true)}
              disabled={!logoUrl || removing}
              className={`
                p-2 rounded-md border
                bg-muted/20 transition
                focus:outline-none focus:ring-2 focus:ring-primary
                ${!logoUrl || removing 
                  ? "opacity-40 cursor-not-allowed" 
                  : "hover:bg-muted"}
              `}
            >
              {removing ? (
                <div className="h-5 w-5 animate-spin border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <X className="h-5 w-5 text-white" />
              )}
            </button>

            {/* Save Logo (Checkmark) */}
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className={`
                p-2 rounded-md border
                bg-muted/20 transition
                focus:outline-none focus:ring-2 focus:ring-primary
                ${!hasChanges || saving
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-muted"}
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

        {/* Preview */}
        <div className="flex justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Church Logo"
              className="h-40 w-40 rounded-md object-cover border border-border bg-white shadow-md"
            />
          ) : (
            <div className="h-40 w-40 rounded-md bg-muted flex items-center justify-center text-xl font-semibold text-muted-foreground border border-border">
              {getInitials(churchName)}
            </div>
          )}
        </div>

        {/* Drag-and-drop uploader */}
        <ImageDropzone
          label="Upload Church Logo"
          path={uploadPath}
          onUploaded={(url) => {
            setLogoUrl(url);
            setUploadPath(`churches/${churchId}/logo/logo-${Date.now()}.png`);
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

        {/* Save + Remove (bottom-right) */}
        {/* <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="destructive"
            onClick={() => setShowConfirmRemove(true)}
            disabled={!logoUrl || removing}
          >
            Remove Logo
          </Button>

          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div> */}

        {/* Confirm Remove */}
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
                {removing ? "Removing..." : "Confirm Remove"}
              </Button>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
