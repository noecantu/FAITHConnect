//app/(dashboard)/admin/users/[id]/EditUserForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/use-toast";

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

import { ALL_ROLES, SYSTEM_ROLES, ROLE_LABELS, type Role, SystemRole } from "@/app/lib/auth/roles";
import type { User } from "@/app/lib/types";
import RoleSelector from "@/app/components/settings/RoleSelector";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";

// Firestore admin API
async function updateUser(input: any) {
  const res = await fetch("/api/users/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return res.json();
}

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

  const userRoles = user.roles ?? [];

  const isSystemUser = userRoles.every((r) =>
    SYSTEM_ROLES.includes(r as SystemRole)
  );

  const isChurchUser = userRoles.every((r) =>
    ALL_ROLES.includes(r as Role)
  );

  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [email, setEmail] = useState(user.email ?? "");

  const [systemRole, setSystemRole] = useState<SystemRole>(
    isSystemUser ? (user.roles[0] as SystemRole) : SYSTEM_ROLES[0]
  );

  const [roles, setRoles] = useState<Role[]>(
    !isSystemUser ? (user.roles as Role[]) ?? [] : []
  );

  const [churchId, setChurchId] = useState(
    !isSystemUser ? user.churchId ?? "" : ""
  );

  // ⭐ NEW: Region name for Regional Admin
  const [regionName, setRegionName] = useState("");

  const [loading, setLoading] = useState(false);

  // ⭐ Load region name if user is already a Regional Admin
  useEffect(() => {
    async function loadRegion() {
      if (systemRole !== "RegionalAdmin") return;

      const rid = user?.regionId;

      // Prevent invalid Firestore doc IDs
      if (typeof rid !== "string" || rid.trim().length < 10) {
        return;
      }

      try {
        const snap = await getDoc(doc(db, "regions", rid));

        if (snap.exists()) {
          const data = snap.data();
          setRegionName(data.name || "");
        }
      } catch (err) {
        console.error("Failed to load region:", err);
      }
    }

    loadRegion();
  }, [systemRole, user?.regionId]);

  function toggleRole(role: Role, checked: boolean) {
    if (checked) setRoles((prev) => [...prev, role]);
    else setRoles((prev) => prev.filter((r) => r !== role));
  }

  async function handleSave() {
    if (!currentUser) {
      toast({
        title: "Not Authorized",
        description: "You must be logged in as an admin.",
      });
      return;
    }

    setLoading(true);

    const actorUid = currentUser.id;
    const actorName = `${currentUser.firstName} ${currentUser.lastName}`.trim();

    let regionPayload = null;

    // ⭐ If Regional Admin, region name is required
    if (systemRole === "RegionalAdmin") {
      if (!regionName.trim()) {
        toast({
          title: "Region Required",
          description: "Please enter a region name for this Regional Admin.",
        });
        setLoading(false);
        return;
      }

      regionPayload = {
        regionName,
      };
    }

    await updateUser({
      userId,
      firstName,
      lastName,
      email,
      roles: isSystemUser ? [systemRole] : roles,
      churchId: isSystemUser ? null : churchId,
      actorUid,
      actorName,
      ...regionPayload,
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
        <>
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
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ⭐ Region Name (only for Regional Admin) */}
          {systemRole === "RegionalAdmin" && (
            <div className="space-y-2">
              <Label>Region Name</Label>
              <Input
                placeholder="e.g., West Texas District"
                value={regionName}
                onChange={(e) => setRegionName(e.target.value)}
              />
            </div>
          )}
        </>
      )}

      {/* CHURCH USER UI */}
      {isChurchUser && (
        <>
          <div className="space-y-2">
            <Label>Church</Label>
              <Select value={churchId || "none"} onValueChange={setChurchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a church" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">(No church)</SelectItem>
                  {user.churchId && (
                    <SelectItem value={user.churchId}>{user.churchId}</SelectItem>
                  )}
                </SelectContent>
              </Select>
          </div>

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