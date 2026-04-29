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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";

import { NON_CHURCH_ROLES, ROLE_LABELS, type Role, type NonChurchRole } from "@/app/lib/auth/roles";
import type { AppUser } from "@/app/lib/types";
import RoleSelector from "@/app/components/settings/RoleSelector";
import { getSupabaseClient } from "@/app/lib/supabase/client";

// Firestore admin API
async function updateUser(input: any) {
  const res = await fetch("/api/users/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => ({ error: "Failed to update user." }));

  if (!res.ok) {
    throw new Error(data.error || "Failed to update user.");
  }

  return data;
}

async function deleteUser(uid: string) {
  const res = await fetch("/api/system-users/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid }),
  });

  const data = await res.json().catch(() => ({ error: "Failed to delete system user." }));

  if (!res.ok) {
    throw new Error(data.error || "Failed to delete system user.");
  }

  return data;
}

export default function EditUserForm({
  userId,
  user,
}: {
  userId: string;
  user: AppUser;
}) {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const userRoles = user.roles ?? [];

  const isSystemUser = userRoles.some((r) =>
    NON_CHURCH_ROLES.includes(r as NonChurchRole)
  );

  const [first_name, setFirstName] = useState(user.first_name ?? "");
  const [last_name, setLastName] = useState(user.last_name ?? "");
  const [email, setEmail] = useState(user.email ?? "");

  const [systemRole, setSystemRole] = useState<NonChurchRole>(
    userRoles.find((r) => NON_CHURCH_ROLES.includes(r as NonChurchRole)) as NonChurchRole
  );

  const [roles, setRoles] = useState<Role[]>(
    userRoles.filter((r) => !NON_CHURCH_ROLES.includes(r as NonChurchRole)) as Role[]
  );

  const [church_id, setChurchId] = useState(
    !isSystemUser ? user.church_id ?? "" : ""
  );

  // ⭐ NEW: Region name for Regional Admin
  const [regionName, setRegionName] = useState("");

  // ⭐ NEW: District name for District Admin
  const [districtName, setDistrictName] = useState("");
  const [districtTitle, setDistrictTitle] = useState("");
  const [districtState, setDistrictState] = useState("");

  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ⭐ Load region name if user is already a Regional Admin
  useEffect(() => {
    async function loadRegion() {
      if (systemRole !== "RegionalAdmin") return;

      const rid = user?.region_id;

      // Prevent invalid Firestore doc IDs
      if (typeof rid !== "string" || rid.trim().length < 10) {
        return;
      }

      try {
        const { data } = await supabase.from("regions").select('*').eq('id', rid).single();
        if (data) setRegionName(data.name || "");
      } catch (err) {
        console.error("Failed to load region:", err);
      }
    }

    loadRegion();
  }, [systemRole, user?.region_id]);

  // ⭐ Load district name if user is already a District Admin
  useEffect(() => {
    async function loadDistrict() {
      if (systemRole !== "DistrictAdmin") return;

      const did = (user as any)?.district_id;

      if (typeof did !== "string" || did.trim().length < 10) return;

      try {
        const { data } = await supabase.from("districts").select('*').eq('id', did).single();
        if (data) {
          setDistrictName(data.name || "");
          setDistrictTitle(data.region_admin_title || "");
          setDistrictState(data.state || "");
        }
      } catch (err) {
        console.error("Failed to load district:", err);
      }
    }

    loadDistrict();
  }, [systemRole, (user as any)?.district_id]);

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

    const actorUid = currentUser.uid;
    const actorName = `${currentUser.first_name} ${currentUser.last_name}`.trim();

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

      regionPayload = { regionName };
    }

    // ⭐ If District Admin, district name is required
    let districtPayload = null;

    if (systemRole === "DistrictAdmin") {
      if (!districtName.trim()) {
        toast({
          title: "District Required",
          description: "Please enter a district name for this District Admin.",
        });
        setLoading(false);
        return;
      }

      districtPayload = { districtName, districtTitle, districtState };
    }

    try {
      await updateUser({
        userId,
        first_name,
        last_name,
        email,
        roles: isSystemUser ? [systemRole] : roles,
        church_id: isSystemUser ? null : church_id,
        actorUid,
        actorName,
        ...regionPayload,
        ...districtPayload,
      });

      toast({
        title: "User Updated",
        description: "Changes saved successfully.",
      });

      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update user.";

      toast({
        title: "Update Failed",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);

    try {
      await deleteUser(userId);

      toast({
        title: "User Deleted",
        description: "The system user has been removed.",
      });

      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete system user.";

      toast({
        title: "Delete Failed",
        description: message,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* First Name */}
      <div className="space-y-2">
        <Label>First Name</Label>
        <Input
          value={first_name}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>

      {/* Last Name */}
      <div className="space-y-2">
        <Label>Last Name</Label>
        <Input
          value={last_name}
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
              onValueChange={(val) => setSystemRole(val as NonChurchRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a system role" />
              </SelectTrigger>
              <SelectContent>
                {NON_CHURCH_ROLES.map((role) => (
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

          {/* ⭐ District Name (only for District Admin) */}
          {systemRole === "DistrictAdmin" && (
            <>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g., Bishop, Apostle, President"
                  value={districtTitle}
                  onChange={(e) => setDistrictTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>District Name</Label>
                <Input
                  placeholder="e.g., Central District"
                  value={districtName}
                  onChange={(e) => setDistrictName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>State</Label>
                <Input
                  placeholder="e.g., Alabama"
                  value={districtState}
                  onChange={(e) => setDistrictState(e.target.value)}
                />
              </div>
            </>
          )}
        </>
      )}

      {/* CHURCH USER UI */}
      {!isSystemUser && (
        <>
          <div className="space-y-2">
            <Label>Church</Label>
              <Select value={church_id || "none"} onValueChange={setChurchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a church" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="none">(No church)</SelectItem>
                  {user.church_id && (
                    <SelectItem value={user.church_id}>{user.church_id}</SelectItem>
                  )}
                </SelectContent>
              </Select>
          </div>

          <RoleSelector
            selectedRoles={roles}
            onChange={toggleRole}
            currentUserId={currentUser?.uid ?? ""}
            targetUserId={userId}
            currentUserRoles={currentUser?.roles ?? []}
          />
        </>
      )}

      <Button className="w-full" onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="destructive"
            className="w-full"
            disabled={isDeleting || currentUser?.uid === userId}
          >
            {currentUser?.uid === userId
              ? "Current User"
              : isDeleting
              ? "Deleting..."
              : "Delete User"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this system user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the login for {email}. Regional or district leaders with assigned entities must be reassigned first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}