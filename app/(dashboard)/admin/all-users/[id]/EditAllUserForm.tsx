"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/use-toast";
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
import { CHURCH_ROLES, ROLE_LABELS, type Role } from "@/app/lib/auth/roles";

export type EditableNonSystemUser = {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  churchId: string | null;
};

type ChurchOption = {
  id: string;
  name: string;
};

async function updateUser(input: unknown) {
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
  const res = await fetch("/api/church-users/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid }),
  });

  const data = await res.json().catch(() => ({ error: "Failed to delete user." }));

  if (!res.ok) {
    throw new Error(data.error || "Failed to delete user.");
  }

  return data;
}

export default function EditAllUserForm({
  user,
  churches,
}: {
  user: EditableNonSystemUser;
  churches: ChurchOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [churchId, setChurchId] = useState(user.churchId ?? "none");
  const [roles, setRoles] = useState<Role[]>(
    (user.roles ?? []).filter((role) => CHURCH_ROLES.includes(role))
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedChurches = useMemo(
    () => [...churches].sort((a, b) => a.name.localeCompare(b.name)),
    [churches]
  );

  function toggleRole(role: Role, checked: boolean) {
    setRoles((prev) => {
      if (checked) {
        if (prev.includes(role)) return prev;
        return [...prev, role];
      }

      return prev.filter((r) => r !== role);
    });
  }

  async function handleSave() {
    if (!currentUser) {
      toast({
        title: "Not Authorized",
        description: "You must be logged in as Root Admin.",
      });
      return;
    }

    setIsSaving(true);

    try {
      await updateUser({
        userId: user.uid,
        firstName,
        lastName,
        email,
        roles,
        churchId: churchId === "none" ? null : churchId,
        actorUid: currentUser.uid,
        actorName: `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim(),
      });

      toast({
        title: "User Updated",
        description: "Changes saved successfully.",
      });

      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update user.";

      toast({
        title: "Error",
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);

    try {
      await deleteUser(user.uid);

      toast({
        title: "User Deleted",
        description: "The user account has been removed.",
      });

      router.push("/admin/all-users");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete user.";

      toast({
        title: "Error",
        description: message,
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>First Name</Label>
        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Last Name</Label>
        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="space-y-2">
        <Label>Church</Label>
        <Select value={churchId || "none"} onValueChange={setChurchId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a church" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">(No church)</SelectItem>
            {sortedChurches.map((church) => (
              <SelectItem key={church.id} value={church.id}>
                {church.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Roles</Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CHURCH_ROLES.map((role) => (
            <label key={role} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={roles.includes(role)}
                onCheckedChange={(checked) => toggleRole(role, checked === true)}
              />
              <span>{ROLE_LABELS[role]}</span>
            </label>
          ))}
        </div>
      </div>

      <Button className="w-full" onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save Changes"}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="w-full" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete User"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the user account and cannot be undone.
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