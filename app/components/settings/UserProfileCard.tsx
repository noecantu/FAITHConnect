"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import type { User } from "@/app/lib/types";

export default function UserProfileCard({
  user,
  onDirtyChange,
  registerSave,
}: {
  user: User;
  onDirtyChange?: (dirty: boolean) => void;
  registerSave?: (fn: () => Promise<void>) => void;
}) {
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [email, setEmail] = useState(user.email ?? "");

  const [initial, setInitial] = useState({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email ?? "",
  });

  // Dirty tracking
  useEffect(() => {
    if (!onDirtyChange) return;

    const dirty =
      firstName !== initial.firstName ||
      lastName !== initial.lastName ||
      email !== initial.email;

    onDirtyChange(dirty);
  }, [firstName, lastName, email, initial, onDirtyChange]);

  // Save function for FAB
  async function save() {
    const ref = doc(db, "users", user.id);

    await updateDoc(ref, {
      firstName,
      lastName,
      email,
    });

    setInitial({ firstName, lastName, email });
  }

  // Register save function with parent
  useEffect(() => {
    if (registerSave) registerSave(save);
  }, [registerSave, save]);

  return (
    <Card className="relative bg-black/30 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>First Name</Label>
          <Input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Last Name</Label>
          <Input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
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
