"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/use-toast";
import { updateUserAction } from "@/app/(protected)/admin/actions/updateUserAction";

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

import { ALL_ROLES, Role } from "@/app/lib/auth/permissions/roles";
import { SystemRole, SYSTEM_ROLES } from "@/app/lib/system-roles";
import { SYSTEM_ROLE_MAP } from "@/app/lib/system-role-map";
import type { User } from "@/app/lib/types";
import RoleSelector from "@/app/components/settings/RoleSelector";

export default function EditUserForm({
  userId,
  user,
}: {
  userId: string;
  user: User;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Detect if this is a system-level user
  const userRoles = user.roles ?? [];

  const isSystemUser = userRoles.every((r) =>
    SYSTEM_ROLES.includes(r as SystemRole)
  );

  const isChurchUser = userRoles.every((r) =>
    ALL_ROLES.includes(r as Role)
  );

  // State
  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [email, setEmail] = useState(user.email ?? "");

  // System users have exactly ONE system role
  const [systemRole, setSystemRole] = useState<SystemRole>(
    isSystemUser
      ? (user.roles[0] as SystemRole)
      : SYSTEM_ROLES[0]
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
        // variant: "destructive",
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
      {isChurchUser && (
        <>
          {/* Church */}
          <div className="space-y-2">
            <Label>Church</Label>
            <Select value={churchId} onValueChange={setChurchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a church" />
              </SelectTrigger>
              <SelectContent>
                {/* TODO: Replace with real church list */}
                <SelectItem value={user.churchId ?? ""}>
                  {user.churchId ?? "(No church)"}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Roles */}
          <RoleSelector
            selectedRoles={roles}
            onChange={toggleRole}
            currentUserId={currentUser?.id ?? ""}
            targetUserId={userId}
            currentUserRoles={currentUser?.roles ?? []}
          />
        </>
      )}

      <Button className="w-full" onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
