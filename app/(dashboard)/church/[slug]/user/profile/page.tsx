"use client";

import { useState } from "react";
import Image from "next/image";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";

export default function MyProfilePage() {
  const { user, loading } = useCurrentUser();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading || !user) {
    return <div className="p-6">Loading...</div>;
  }

  const initials =
    (user.firstName?.[0] ??
      user.lastName?.[0] ??
      user.email[0] ??
      "U").toUpperCase();

  async function handleSave() {
    setSaving(true);

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    if (photoFile) formData.append("photo", photoFile);

    await fetch("/api/users/update-profile", {
      method: "POST",
      body: formData,
    });

    setSaving(false);
    window.location.reload();
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
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
        </CardContent>
      </Card>
    </div>
  );
}
