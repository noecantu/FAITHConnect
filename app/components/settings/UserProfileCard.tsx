"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/app/lib/supabase/client";
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
  const supabase = getSupabaseClient();
  const [first_name, setFirstName] = useState(user.first_name ?? "");
  const [last_name, setLastName] = useState(user.last_name ?? "");
  const [email, setEmail] = useState(user.email ?? "");

  const [initial, setInitial] = useState({
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    email: user.email ?? "",
  });

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
    const ref = doc(db, "users", user.uid);

    await updateDoc(ref, {
      first_name,
      last_name,
      email,
    });

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
