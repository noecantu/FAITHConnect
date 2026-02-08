// app/admin/users/create/CreateSystemUserClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSystemUserAction } from "@/app/(protected)/admin/actions/createSystemUserAction";
import { useToast } from "@/app/hooks/use-toast";
import { useAuth } from "@/app/hooks/useAuth";

import { PageHeader } from "@/app/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";

const ACCOUNT_TYPES = [
  { value: "RootAdmin", label: "Root Administrator" },
  { value: "SystemAdmin", label: "System Administrator" },
  { value: "Support", label: "Support Staff" },
  { value: "Auditor", label: "Auditor (Read-Only)" },
];

export default function CreateSystemUserClient() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateUser() {
    try {
      setLoading(true);

      if (!accountType) {
        toast({
          title: "Missing Account Type",
          description: "Please select an account type for this system user.",
          variant: "destructive",
        });
        return;
      }

      if (!currentUser) {
        toast({
          title: "Not Authorized",
          description: "You must be logged in as a system admin.",
          variant: "destructive",
        });
        return;
      }

      const actorUid = currentUser.id;
      const actorName =
        `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
        "System Admin";

      const result = await createSystemUserAction({
        firstName,
        lastName,
        email,
        password,
        // accountType,
        actorUid,
        actorName,
      });

      if (result.success) {
        toast({
          title: "System User Created",
          description: "The new system-level user has been added.",
        });

        router.push("/admin/users");
      }
    } catch (err: any) {
      console.error("Failed to create system user:", err);

      toast({
        title: "Error",
        description: err.message || "Could not create system user.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Create System-Level User"
        subtitle="Add a new system administrator or support account."
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
              placeholder="user@example.com"
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

          {/* Account Type */}
          <div className="space-y-2">
            <Label>Account Type</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <Button
            className="w-full mt-4"
            onClick={handleCreateUser}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create System User"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
