"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/app/lib/firebase/client";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import type { User } from "@/app/lib/types";

export function ProfilePhotoCard({
  user,
  onDirtyChange,
  registerSave,
}: {
  user: User;
  onDirtyChange?: (dirty: boolean) => void;
  registerSave?: (fn: () => Promise<void>) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.profilePhotoUrl ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [removeRequested, setRemoveRequested] = useState(false);

  const initials =
    (user.firstName?.[0] ??
      user.lastName?.[0] ??
      user.email?.[0] ??
      "U").toUpperCase();

  // Dirty tracking
  const dirty = Boolean(file) || removeRequested;

  useEffect(() => {
    if (onDirtyChange) onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  const handleSave = useCallback(async () => {
    const userRef = doc(db, "users", user.id);

    // Remove photo
    if (removeRequested && user.profilePhotoUrl) {
      const fileRef = ref(storage, `users/${user.id}/profile.jpg`);
      await deleteObject(fileRef).catch(() => {});
      await updateDoc(userRef, { profilePhotoUrl: null });
      setPreviewUrl(null);
      setRemoveRequested(false);
      return;
    }

    // Upload new photo
    if (file) {
      const fileRef = ref(storage, `users/${user.id}/profile.jpg`);
      const bytes = await file.arrayBuffer();
      await uploadBytes(fileRef, new Uint8Array(bytes), {
        contentType: file.type,
      });

      const url = await getDownloadURL(fileRef);
      await updateDoc(userRef, { profilePhotoUrl: url });

      setPreviewUrl(url);
      setFile(null);
    }
  }, [file, removeRequested, user.id, user.profilePhotoUrl]);

  useEffect(() => {
    if (registerSave) registerSave(handleSave);
  }, [registerSave, handleSave]);

  return (
    <Card className="relative bg-black/30 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Profile Photo</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
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

          <div className="flex flex-col gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f) {
                  setPreviewUrl(URL.createObjectURL(f));
                  setRemoveRequested(false);
                }
              }}
            />

            {previewUrl && (
              <Button
                variant="destructive"
                onClick={() => {
                  setPreviewUrl(null);
                  setFile(null);
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
