"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/app/lib/firebase/client";
import { ref, deleteObject } from "firebase/storage";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import ImageDropzone from "@/app/components/settings/ImageDropzone";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.profilePhotoUrl ?? null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [removeRequested, setRemoveRequested] = useState(false);

  const initials =
    (user.firstName?.[0] ??
      user.lastName?.[0] ??
      user.email?.[0] ??
      "U").toUpperCase();

  // Dirty tracking
  const dirty = Boolean(uploadedUrl) || removeRequested;

  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

  const handleSave = useCallback(async () => {
    const userRef = doc(db, "users", user.uid);

    // Remove photo
    if (removeRequested && user.profilePhotoUrl) {
      const fileRef = ref(storage, `users/${user.uid}/profile.jpg`);
      await deleteObject(fileRef).catch(() => {});
      await updateDoc(userRef, { profilePhotoUrl: null });

      setPreviewUrl(null);
      setUploadedUrl(null);
      setRemoveRequested(false);
      return;
    }

    // Save uploaded photo
    if (uploadedUrl) {
      await updateDoc(userRef, { profilePhotoUrl: uploadedUrl });
      setPreviewUrl(uploadedUrl);
      setUploadedUrl(null);
    }
  }, [uploadedUrl, removeRequested, user.uid, user.profilePhotoUrl]);

  useEffect(() => {
    registerSave?.(handleSave);
  }, [registerSave, handleSave]);

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Profile Photo</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">

        {/* Preview */}
        <div className="flex items-center gap-4">
          <div className="h-32 w-32 shrink-0 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center text-xl font-semibold">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Profile Photo"
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full">

            {/* Drag-and-drop uploader */}
            <ImageDropzone
              label="Upload Profile Photo"
              path={`users/${user.uid}/profile.jpg`}
              onUploaded={(url) => {
                setUploadedUrl(url);
                setPreviewUrl(url);
                setRemoveRequested(false);
              }}
            />

            {previewUrl && (
              <Button
                variant="destructive"
                onClick={() => {
                  setPreviewUrl(null);
                  setUploadedUrl(null);
                  setRemoveRequested(true);
                }}
              >
                Remove Photo
              </Button>
            )}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
