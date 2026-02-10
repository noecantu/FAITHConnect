"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/app/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { PageHeader } from "@/app/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useToast } from "@/app/hooks/use-toast";

// Reuse your existing role definitions
import { ROLE_MAP, ALL_ROLES } from '@/app/lib/roles';

export default function AddUserPage() {
  const params = useParams();
  const churchIdRaw = params?.churchId;

  const churchIdStr = Array.isArray(churchIdRaw)
    ? churchIdRaw[0]
    : churchIdRaw;

  // ❗ Hooks must come BEFORE any return
  const router = useRouter();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ❗ Now we can safely check params
  if (!churchIdStr || typeof churchIdStr !== "string") {
    console.error("Invalid churchId param");
    return <div>Invalid church ID</div>;
  }

  const churchIdSafe: string = churchIdStr;

  function handleRoleChange(role: string, checked: boolean) {
    if (checked) {
      setSelectedRoles((prev) => [...prev, role]);
    } else {
      setSelectedRoles((prev) => prev.filter((r) => r !== role));
    }
  }

  async function handleCreateAdmin() {
    try {
      setLoading(true);

      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        roles: selectedRoles,
        churchId: churchIdSafe,
        enabledAt: serverTimestamp(),
      });

      toast({
        title: "Admin Created",
        description: "The new user has been added successfully.",
      });

      router.push(`/admin/churches/${churchIdSafe}`);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Unknown error");

      console.error("Failed to create user:", error);

      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Add Church User"
        subtitle="Create a new user for this church"
      />

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* First Name */}
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Roles */}
          <div className="space-y-4">
            <h4 className="text-md font-bold">Roles & Permissions</h4>
            <div className="space-y-2">
                {ALL_ROLES.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={(checked) =>
                        handleRoleChange(role, !!checked)
                    }
                    />
                    <Label>{ROLE_MAP[role]}</Label>
                </div>
                ))}
            </div>
          </div>

          {/* Save Button */}
          <Button
            className="w-full mt-4"
            onClick={handleCreateAdmin}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create User"}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
