"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/use-toast";
import { updateUserAction } from "@/app/admin/actions/updateUserAction";

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
import { SystemRole, SYSTEM_ROLES } from "@/app/lib/system-roles";
import { SYSTEM_ROLE_MAP } from "@/app/lib/system-role-map";

export default function EditUserForm({
  userId,
  user,
}: {
  userId: string;
  user: any;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Detect if this is a system-level user
  const isSystemUser = user.roles?.some((r: string) =>
    SYSTEM_ROLES.includes(r as SystemRole)
  );

  // State
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [email, setEmail] = useState(user.email ?? "");

  // System users have exactly ONE system role
  const [systemRole, setSystemRole] = useState<SystemRole | "">(
    isSystemUser ? (user.roles[0] as SystemRole) : ""
  );

  // Church users have church roles + churchId
  const [roles, setRoles] = useState<Role[]>(
    !isSystemUser ? (user.roles as Role[]) ?? [] : []
  );
  const [churchId, setChurchId] = useState(
    !isSystemUser ? user.churchId ?? "" : ""
  );

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
      roles: isSystemUser ? [systemRole] : roles,
      churchId: isSystemUser ? null : churchId,
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
        <Input
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <Label>Last Name</Label>
        <Input
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {/* SYSTEM USER UI */}
      {isSystemUser && (
        <div className="space-y-2">
          <Label>System Role</Label>
          <Select
            value={systemRole}
            onValueChange={(val) => setSystemRole(val as SystemRole)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a system role" />
            </SelectTrigger>
            <SelectContent>
              {SYSTEM_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {SYSTEM_ROLE_MAP[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* CHURCH USER UI */}
      {!isSystemUser && (
        <>
          {/* Church */}
          <div className="space-y-2">
            <Label>Church</Label>
            <Select value={churchId} onValueChange={setChurchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a church" />
              </SelectTrigger>
              <SelectContent>
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
        </>
      )}

      <Button className="w-full" onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
