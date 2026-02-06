"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/use-toast";
import { updateUserAction } from "./actions";

import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";

import { ALL_ROLES, ROLE_MAP, Role } from "@/app/lib/roles";

export default function EditUserForm({ userId, user }: { userId: string; user: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [roles, setRoles] = useState<Role[]>(user.roles ?? []);
  const [churchId, setChurchId] = useState(user.churchId ?? "");

  const [loading, setLoading] = useState(false);

  function toggleRole(role: Role, checked: boolean) {
    if (checked) setRoles((prev) => [...prev, role]);
    else setRoles((prev) => prev.filter((r) => r !== role));
  }

  async function handleSave() {
    if (!currentUser) {
      toast({
        title: "Not Authorized",
        description: "You must be logged in as an admin.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const actorUid = currentUser.id;
    const actorName = `${currentUser.firstName} ${currentUser.lastName}`.trim();

    await updateUserAction({
      userId,
      firstName,
      lastName,
      email,
      roles,
      churchId,
      actorUid,
      actorName,
    });

    toast({
      title: "User Updated",
      description: "Changes saved successfully.",
    });

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-6">

      {/* First Name */}
      <div className="space-y-2">
        <Label>First Name</Label>
        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <Label>Last Name</Label>
        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      {/* Church */}
      <div className="space-y-2">
        <Label>Church</Label>
        <Select value={churchId} onValueChange={setChurchId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a church" />
          </SelectTrigger>
          <SelectContent>
            {/* You can load churches here or pass them in */}
            <SelectItem value={user.churchId}>{user.churchId}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Roles */}
      <div className="space-y-4">
        <h4 className="text-md font-bold">Roles</h4>
        {ALL_ROLES.map((role) => (
          <div key={role} className="flex items-center space-x-2">
            <Checkbox
              checked={roles.includes(role)}
              onCheckedChange={(checked) => toggleRole(role, !!checked)}
            />
            <Label>{ROLE_MAP[role]}</Label>
          </div>
        ))}
      </div>

      <Button className="w-full" onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
