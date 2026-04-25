"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { getSupabaseClient } from "@/app/lib/supabase/client";

interface ChangePasswordCardProps {
  onDirtyChange: (v: boolean) => void;
  registerSave: (fn: () => Promise<void>) => void;
}

export function ChangePasswordCard({ onDirtyChange, registerSave }: ChangePasswordCardProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const isDirty = current !== "" || next !== "" || confirm !== "";

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleSave = useCallback(async () => {
    if (!isDirty) return;

    if (next !== confirm) {
      throw new Error("Passwords do not match.");
    }

    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const email = user.email;
    if (!email) throw new Error("Missing email.");

    const { error: reAuthError } = await supabase.auth.signInWithPassword({ email, password: current });
    if (reAuthError) throw new Error("Current password is incorrect.");

    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    if (updateError) throw new Error(updateError.message);

    setCurrent("");
    setNext("");
    setConfirm("");
  }, [isDirty, current, next, confirm]);

  useEffect(() => {
    registerSave(handleSave);
  }, [registerSave, handleSave]);

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Password</label>
          <Input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Enter current password"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">New Password</label>
          <Input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Enter new password"
          />
        </div>

        <div className="space-y-2">
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
