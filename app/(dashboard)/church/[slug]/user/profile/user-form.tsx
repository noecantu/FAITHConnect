"use client";

import { useState } from "react";
import Image from "next/image";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import type { UserProfile } from "@/app/lib/types";
import { storage } from "@/app/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export function UserForm({
  user,
  onClose,
}: {
  user: UserProfile;
  onClose: () => void;
}) {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const initials =
    (user.firstName?.[0] ??
      user.lastName?.[0] ??
      user.email[0] ??
      "U").toUpperCase();

  async function handleSave() {
    setSaving(true);

    let profilePhotoUrl = user.profilePhotoUrl ?? "";

    if (photoFile) {
      const fileRef = ref(storage, `users/${user.id}/profile.jpg`);
      await uploadBytes(fileRef, photoFile);
      profilePhotoUrl = await getDownloadURL(fileRef);
    }

    await fetch("/api/users/update-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": user.id,
      },
      body: JSON.stringify({
        firstName,
        lastName,
        profilePhotoUrl,
      }),
    });

    setSaving(false);
    onClose();
    window.location.reload();
  }

  return (
    <div className="space-y-6 mt-4">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          {user.profilePhotoUrl ? (
            <Image
              src={user.profilePhotoUrl}
              alt="Profile Photo"
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
          ) : (
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          )}
        </Avatar>

        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* First Name */}
      <div>
        <label className="text-sm font-medium">First Name</label>
        <Input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>

      {/* Last Name */}
      <div>
        <label className="text-sm font-medium">Last Name</label>
        <Input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
