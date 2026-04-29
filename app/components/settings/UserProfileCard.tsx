"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import type { AppUser } from "@/app/lib/types";

export default function UserProfileCard({
  user,
  onDirtyChange,
  registerSave,
}: {
  user: AppUser;
  onDirtyChange?: (dirty: boolean) => void;
  registerSave?: (fn: () => Promise<void>) => void;
}) {
  const [first_name, setFirstName] = useState(user.first_name ?? user.firstName ?? "");
  const [last_name, setLastName] = useState(user.last_name ?? user.lastName ?? "");
  const [email, setEmail] = useState(user.email ?? "");

  const [initial, setInitial] = useState({
    first_name: user.first_name ?? user.firstName ?? "",
    last_name: user.last_name ?? user.lastName ?? "",
    email: user.email ?? "",
  });

  useEffect(() => {
    const nextState = {
      first_name: user.first_name ?? user.firstName ?? "",
      last_name: user.last_name ?? user.lastName ?? "",
      email: user.email ?? "",
    };

    setFirstName(nextState.first_name);
    setLastName(nextState.last_name);
    setEmail(nextState.email);
    setInitial(nextState);
  }, [user.first_name, user.firstName, user.last_name, user.lastName, user.email]);

  // Dirty tracking
  useEffect(() => {
    if (!onDirtyChange) return;

    const dirty =
      first_name !== initial.first_name ||
      last_name !== initial.last_name ||
      email !== initial.email;

    onDirtyChange(dirty);
  }, [first_name, last_name, email, initial, onDirtyChange]);

  // Save function for FAB
  async function save() {
    const res = await fetch("/api/users/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: first_name,
        lastName: last_name,
      }),
    });

    const data = await res.json().catch(() => ({ error: "Failed to update profile." }));
    if (!res.ok) {
      throw new Error(data.error || "Failed to update profile.");
    }

    setInitial({ first_name, last_name, email });
  }

  // Register save function with parent
  useEffect(() => {
    if (registerSave) registerSave(save);
  }, [registerSave, save]);

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input
            value={first_name}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input
            value={last_name}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
