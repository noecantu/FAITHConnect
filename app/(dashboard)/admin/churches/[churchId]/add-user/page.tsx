"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/app/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useToast } from "@/app/hooks/use-toast";
import { ROLE_LABELS, ALL_ROLES, SYSTEM_ROLE_LIST } from "@/app/lib/auth/roles";

export default function AddUserPage() {
  const params = useParams();
  const churchIdRaw = params?.church_id;
  const churchIdStr = Array.isArray(churchIdRaw) ? churchIdRaw[0] : churchIdRaw;
  const router = useRouter();
  const { toast } = useToast();

  const churchRolesOnly = ALL_ROLES.filter((role) => !SYSTEM_ROLE_LIST.includes(role));

  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!churchIdStr || typeof churchIdStr !== "string") {
    return <div>Invalid church ID</div>;
  }

  const churchIdSafe: string = churchIdStr;

  function handleRoleChange(role: string, checked: boolean) {
    if (checked) setSelectedRoles((prev) => [...prev, role]);
    else setSelectedRoles((prev) => prev.filter((r) => r !== role));
  }

  async function handleCreateAdmin() {
    try {
      setLoading(true);

      const res = await fetch("/api/church-users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: first_name.trim(),
          lastName: last_name.trim(),
          password,
          roles: selectedRoles,
          churchId: churchIdSafe,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to create user.");
      }

      toast({ title: "User Created", description: "The new user has been added successfully." });
      router.push(`/admin/churches/${churchIdSafe}`);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      toast({ title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader title="Add Church User" subtitle="Create a new user for this church" />
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input value={first_name} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input value={last_name} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" placeholder="Minimum 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-4">
            <h4 className="text-md font-bold">Roles &amp; Permissions</h4>
            <div className="space-y-2">
              {churchRolesOnly.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={(checked) => handleRoleChange(role, !!checked)}
                  />
                  <Label>{ROLE_LABELS[role]}</Label>
                </div>
              ))}
            </div>
          </div>
          <Button className="w-full mt-4" onClick={handleCreateAdmin} disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

