// app/admin/users/create/CreateUserClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserAction } from "@/app/(protected)/admin/actions/createUserAction";
import { useToast } from "@/app/hooks/use-toast";
import { useAuth } from "@/app/hooks/useAuth";

import { PageHeader } from "@/app/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";

import { ALL_ROLES, ROLE_MAP, Role } from "@/app/lib/roles";

type ChurchRecord = {
  id: string;
  name: string;
};

interface CreateUserClientProps {
  churches: ChurchRecord[];
}

export default function CreateUserClient({ churches }: CreateUserClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [selectedChurch, setSelectedChurch] = useState("");
  const [loading, setLoading] = useState(false);

  function handleRoleChange(role: Role, checked: boolean) {
    setSelectedRoles((prev) =>
      checked ? [...prev, role] : prev.filter((r) => r !== role)
    );
  }

  async function handleCreateUser() {
    try {
      setLoading(true);

      if (!selectedChurch) {
        toast({
          title: "Missing Church",
          description: "Please select a church for this user.",
          variant: "destructive",
        });
        return;
      }

      if (!currentUser) {
        toast({
          title: "Not Authorized",
          description: "You must be logged in as an admin to create users.",
          variant: "destructive",
        });
        return;
      }

      const actorUid = currentUser.id;
      const actorName =
        `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim() ||
        "System Admin";

      const result = await createUserAction({
        firstName,
        lastName,
        email,
        password,
        roles: selectedRoles,
        churchId: selectedChurch,
        actorUid,
        actorName,
      });

      if (result.success) {
        toast({
          title: "User Created",
          description: "The new user has been added successfully.",
        });

        router.push("/admin/users");
      }
      } catch (err: unknown) {
        console.error("Failed to create user:", err);

        const message =
          err instanceof Error ? err.message : "Could not create user.";

        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Create User Account"
        subtitle="Add a new system-level user."
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

          {/* Church Selector */}
          <div className="space-y-2">
            <Label>Church</Label>
            <Select
              value={selectedChurch}
              onValueChange={(val) => setSelectedChurch(val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a church" />
              </SelectTrigger>
              <SelectContent>
                {churches.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                      handleRoleChange(role, Boolean(checked))
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
            onClick={handleCreateUser}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create User"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
