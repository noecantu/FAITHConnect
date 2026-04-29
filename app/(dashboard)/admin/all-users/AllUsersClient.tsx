"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

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
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/use-toast";
import type { Role } from "@/app/lib/auth/roles";
import { CHURCH_ROLES, ROLE_LABELS } from "@/app/lib/auth/roles";

export type NonSystemUserRecord = {
  uid: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roles: Role[];
  churchId?: string | null;
  churchName?: string | null;
  createdAt?: string | number | Date | null;
};

type AllUsersClientProps = {
  users: NonSystemUserRecord[];
  title?: string;
  subtitle?: string;
  cardTitle?: string;
};

type SortOption = "created-desc" | "created-asc" | "name-asc" | "name-desc" | "church-asc" | "church-desc";

export default function AllUsersClient({ users, title = "All Users", subtitle = "Root Admin management for all non-system user accounts.", cardTitle = "Non-System Users" }: AllUsersClientProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("created-desc");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkRole, setBulkRole] = useState<string>("none");
  const [isApplyingRole, setIsApplyingRole] = useState(false);
  const [isRemovingRole, setIsRemovingRole] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [impersonatingUid, setImpersonatingUid] = useState<string | null>(null);

  const usersById = useMemo(
    () => new Map(users.map((u) => [u.uid, u])),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const filtered = users.filter((u) => {
      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const churchName = (u.churchName ?? "").toLowerCase();
      const term = search.toLowerCase().trim();

      if (term && !fullName.includes(term) && !email.includes(term) && !churchName.includes(term)) {
        return false;
      }

      if (selectedRole !== "all" && !u.roles.includes(selectedRole as Role)) {
        return false;
      }

      return true;
    });

    const collator = new Intl.Collator(undefined, { sensitivity: "base" });
    const getDisplayName = (user: NonSystemUserRecord) =>
      `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email || user.uid;
    const getChurchLabel = (user: NonSystemUserRecord) => user.churchName ?? user.churchId ?? "";
    const getCreatedTime = (user: NonSystemUserRecord) => {
      if (!user.createdAt) return 0;
      const timestamp = new Date(user.createdAt).getTime();
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    return [...filtered].sort((left, right) => {
      if (sortBy === "name-asc") {
        return collator.compare(getDisplayName(left), getDisplayName(right));
      }

      if (sortBy === "name-desc") {
        return collator.compare(getDisplayName(right), getDisplayName(left));
      }

      if (sortBy === "church-asc") {
        return collator.compare(getChurchLabel(left), getChurchLabel(right));
      }

      if (sortBy === "church-desc") {
        return collator.compare(getChurchLabel(right), getChurchLabel(left));
      }

      if (sortBy === "created-asc") {
        return getCreatedTime(left) - getCreatedTime(right);
      }

      return getCreatedTime(right) - getCreatedTime(left);
    });
  }, [users, search, selectedRole, sortBy]);

  const selectedCount = selectedUserIds.length;
  const visibleIds = filteredUsers.map((u) => u.uid);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedUserIds.includes(id));

  function toggleOne(uid: string, checked: boolean) {
    setSelectedUserIds((prev) => {
      if (checked) {
        if (prev.includes(uid)) return prev;
        return [...prev, uid];
      }

      return prev.filter((id) => id !== uid);
    });
  }

  function toggleVisible(checked: boolean) {
    setSelectedUserIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, ...visibleIds]));
      }

      const visibleSet = new Set(visibleIds);
      return prev.filter((id) => !visibleSet.has(id));
    });
  }

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

  async function handleBulkAddRole() {
    if (!currentUser) {
      toast({
        title: "Not Authorized",
        description: "You must be logged in as Root Admin.",
      });
      return;
    }

    if (bulkRole === "none") {
      toast({
        title: "Select a Role",
        description: "Choose a role to apply.",
      });
      return;
    }

    const role = bulkRole as Role;
    const targets = selectedUserIds
      .map((id) => usersById.get(id))
      .filter((u): u is NonSystemUserRecord => Boolean(u));

    if (targets.length === 0) return;

    setIsApplyingRole(true);

    try {
      const results = await Promise.allSettled(
        targets.map((u) => {
          const nextRoles = Array.from(new Set([...(u.roles ?? []), role])) as Role[];

          return updateUser({
            userId: u.uid,
            roles: nextRoles,
            actorUid: currentUser.uid,
            actorName: `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim(),
          });
        })
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = results.length - failed;

      if (failed > 0) {
        toast({
          title: "Bulk Update Completed",
          description: `${succeeded} user(s) updated, ${failed} failed.`,
        });
      } else {
        toast({
          title: "Bulk Update Completed",
          description: `${succeeded} user(s) updated successfully.`,
        });
      }

      setSelectedUserIds([]);
      router.refresh();
    } finally {
      setIsApplyingRole(false);
    }
  }

  async function handleBulkRemoveRole() {
    if (!currentUser) {
      toast({
        title: "Not Authorized",
        description: "You must be logged in as Root Admin.",
      });
      return;
    }

    if (bulkRole === "none") {
      toast({
        title: "Select a Role",
        description: "Choose a role to remove.",
      });
      return;
    }

    const role = bulkRole as Role;
    const targets = selectedUserIds
      .map((id) => usersById.get(id))
      .filter((u): u is NonSystemUserRecord => Boolean(u));

    if (targets.length === 0) return;

    setIsRemovingRole(true);

    try {
      const results = await Promise.allSettled(
        targets.map((u) => {
          const nextRoles = (u.roles ?? []).filter((r) => r !== role);

          return updateUser({
            userId: u.uid,
            roles: nextRoles,
            actorUid: currentUser.uid,
            actorName: `${currentUser.firstName ?? ""} ${currentUser.lastName ?? ""}`.trim(),
          });
        })
      );

      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = results.length - failed;

      if (failed > 0) {
        toast({
          title: "Bulk Update Completed",
          description: `${succeeded} user(s) updated, ${failed} failed.`,
        });
      } else {
        toast({
          title: "Bulk Update Completed",
          description: `${succeeded} user(s) updated successfully.`,
        });
      }

      setSelectedUserIds([]);
      router.refresh();
    } finally {
      setIsRemovingRole(false);
    }
  }

  async function handleBulkDelete() {
    const targets = [...selectedUserIds];
    if (targets.length === 0) return;

    setIsBulkDeleting(true);

    try {
      const results = await Promise.allSettled(targets.map((uid) => deleteUser(uid)));

      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = results.length - failed;

      if (failed > 0) {
        toast({
          title: "Bulk Delete Completed",
          description: `${succeeded} user(s) deleted, ${failed} failed.`,
        });
      } else {
        toast({
          title: "Bulk Delete Completed",
          description: `${succeeded} user(s) deleted successfully.`,
        });
      }

      setSelectedUserIds([]);
      router.refresh();
    } finally {
      setIsBulkDeleting(false);
    }
  }

  async function handleImpersonate(targetUid: string) {
    setImpersonatingUid(targetUid);

    try {
      const res = await fetch("/api/admin/impersonation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetUid, returnTo: window.location.pathname }),
      });

      const data = await res.json().catch(() => ({ error: "Failed to start impersonation." }));
      if (!res.ok) {
        throw new Error(data.error || "Failed to start impersonation.");
      }

      window.location.assign("/auth-router");
    } catch (error) {
      setImpersonatingUid(null);
      toast({
        title: "Impersonation failed",
        description: error instanceof Error ? error.message : "Failed to start impersonation.",
      });
    }
  }

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
      />

      <Card>
        <CardHeader>
          <CardTitle>{cardTitle}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search by name, email, or church"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full md:w-72"
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {CHURCH_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Newest first" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created-desc">Created: Newest first</SelectItem>
                  <SelectItem value="created-asc">Created: Oldest first</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                  <SelectItem value="church-asc">Church: A to Z</SelectItem>
                  <SelectItem value="church-desc">Church: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCount > 0 && (
            <div className="rounded-md border p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedCount} user(s) selected.
              </p>

              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Select value={bulkRole} onValueChange={setBulkRole}>
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select role</SelectItem>
                    {CHURCH_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={handleBulkAddRole}
                  disabled={isApplyingRole || isRemovingRole || isBulkDeleting}
                >
                  {isApplyingRole ? "Applying..." : "Add Role"}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleBulkRemoveRole}
                  disabled={isApplyingRole || isRemovingRole || isBulkDeleting}
                >
                  {isRemovingRole ? "Removing..." : "Remove Role"}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isApplyingRole || isRemovingRole || isBulkDeleting}>
                      {isBulkDeleting ? "Deleting..." : "Delete Selected"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete selected users?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {selectedCount} selected account(s). This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete}>Confirm Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

          {filteredUsers.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 px-2 w-10">
                      <Checkbox
                        checked={allVisibleSelected}
                        onCheckedChange={(checked) => toggleVisible(checked === true)}
                        aria-label="Select all visible users"
                      />
                    </th>
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Email</th>
                    <th className="text-left py-2 px-2">Church</th>
                    <th className="text-left py-2 px-2">Roles</th>
                    <th className="text-left py-2 px-2">Created</th>
                    <th className="text-left py-2 px-2 w-36">Support</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.uid}
                      className="border-b border-white/10 cursor-pointer transition-all hover:bg-sky-950/40 hover:shadow-[inset_0_0_0_1px_rgba(56,189,248,0.5)]"
                      onClick={() => router.push(`/admin/all-users/${u.uid}`)}
                    >
                      <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedUserIds.includes(u.uid)}
                          onCheckedChange={(checked) => toggleOne(u.uid, checked === true)}
                          aria-label={`Select ${u.email || u.uid}`}
                        />
                      </td>
                      <td className="py-2 px-2">
                        {u.firstName || u.lastName
                          ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                          : "(No name)"}
                      </td>
                      <td className="py-2 px-2">{u.email || "-"}</td>
                      <td className="py-2 px-2">{u.churchName ?? u.churchId ?? "(No church)"}</td>
                      <td className="py-2 px-2">
                        {u.roles.length > 0
                          ? u.roles.map((r) => ROLE_LABELS[r]).join(", ")
                          : "No roles"}
                      </td>
                      <td className="py-2 px-2">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          disabled={impersonatingUid === u.uid}
                          onClick={() => void handleImpersonate(u.uid)}
                        >
                          <LogIn className="h-4 w-4" />
                          {impersonatingUid === u.uid ? "Starting..." : "Impersonate"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}