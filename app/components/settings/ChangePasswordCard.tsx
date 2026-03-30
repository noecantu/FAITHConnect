"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "@/app/lib/firebase/client";

interface ChangePasswordCardProps {
  onDirtyChange: (v: boolean) => void;
  registerSave: (fn: () => Promise<void>) => void;
}

export function ChangePasswordCard({ onDirtyChange, registerSave }: ChangePasswordCardProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  // Dirty tracking (same pattern as UserProfileCard)
  const isDirty = current !== "" || next !== "" || confirm !== "";

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // Save handler (memoized so registerSave doesn't re-run every keystroke)
  const handleSave = useCallback(async () => {
    if (!auth.currentUser) return;

    if (next !== confirm) {
      throw new Error("Passwords do not match.");
    }

    const email = auth.currentUser.email;
    if (!email) throw new Error("Missing email.");

    // Re-authenticate
    const credential = EmailAuthProvider.credential(email, current);
    await reauthenticateWithCredential(auth.currentUser, credential);

    // Update password
    await updatePassword(auth.currentUser, next);

    // Reset fields after successful save
    setCurrent("");
    setNext("");
    setConfirm("");
  }, [current, next, confirm]);

  // Register save callback (same pattern as UserProfileCard)
  useEffect(() => {
    registerSave(handleSave);
  }, [registerSave, handleSave]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Current Password</label>
          <Input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Enter current password"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">New Password</label>
          <Input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Enter new password"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Confirm New Password</label>
          <Input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>
      </CardContent>
    </Card>
  );
}
