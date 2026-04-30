"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { useToast } from "@/app/hooks/use-toast";

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

import { ROLE_LABELS, type Role } from "@/app/lib/auth/roles";

const OVERSIGHT_ROLES = ["DistrictAdmin", "RegionalAdmin"] as const;
type OversightRole = (typeof OVERSIGHT_ROLES)[number];
type SortOption = "created-desc" | "created-asc" | "name-asc" | "name-desc";

export type UserRecord = {
  uid: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roles: Role[];
  districtId?: string | null;
  regionId?: string | null;
  churchId?: string | null;
  createdAt?: string | number | Date | null;
};

type Props = {
  users: UserRecord[];
};

export default function DistrictRegionalAdminsClient({ users }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("created-desc");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [impersonatingUid, setImpersonatingUid] = useState<string | null>(null);

  const oversightUsers = useMemo(
    () =>
      users.filter((u) =>
        u.roles.some((r) => (OVERSIGHT_ROLES as readonly string[]).includes(r))
      ),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const filtered = oversightUsers.filter((u) => {
      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const term = search.toLowerCase().trim();

      if (term && !fullName.includes(term) && !email.includes(term)) return false;
      if (selectedRole !== "all" && !u.roles.includes(selectedRole as Role)) return false;

      return true;
    });

    const collator = new Intl.Collator(undefined, { sensitivity: "base" });
    const getName = (u: UserRecord) =>
      `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || u.uid;
    const getTime = (u: UserRecord) => {
      if (!u.createdAt) return 0;
      const t = new Date(u.createdAt).getTime();
      return Number.isNaN(t) ? 0 : t;
    };

    return [...filtered].sort((a, b) => {
      if (sortBy === "name-asc") return collator.compare(getName(a), getName(b));
      if (sortBy === "name-desc") return collator.compare(getName(b), getName(a));
      if (sortBy === "created-asc") return getTime(a) - getTime(b);
      return getTime(b) - getTime(a); // created-desc default
    });
  }, [oversightUsers, search, selectedRole, sortBy]);

  const visibleIds = filteredUsers.map((u) => u.uid);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedUserIds.includes(id));
  const selectedCount = selectedUserIds.length;

  function toggleOne(uid: string, checked: boolean) {
    setSelectedUserIds((prev) =>
      checked ? (prev.includes(uid) ? prev : [...prev, uid]) : prev.filter((id) => id !== uid)
    );
  }

  function toggleVisible(checked: boolean) {
    setSelectedUserIds((prev) => {
      if (checked) return Array.from(new Set([...prev, ...visibleIds]));
      const visibleSet = new Set(visibleIds);
      return prev.filter((id) => !visibleSet.has(id));
    });
  }

  async function deleteUser(uid: string) {
    const res = await fetch("/api/system-users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid }),
    });
    const data = await res.json().catch(() => ({ error: "Failed to delete user." }));
    if (!res.ok) throw new Error(data.error || "Failed to delete user.");
    return data;
  }

  async function handleBulkDelete() {
    if (selectedUserIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const results = await Promise.allSettled(selectedUserIds.map(deleteUser));
      const failed = results.filter((r) => r.status === "rejected").length;
      const succeeded = results.length - failed;
      toast({
        title: "Bulk Delete Completed",
        description:
          failed > 0
            ? `${succeeded} deleted, ${failed} failed.`
            : `${succeeded} user(s) deleted successfully.`,
      });
      setSelectedUserIds([]);
      router.refresh();
    } finally {
      setIsBulkDeleting(false);
    }
  }

  async function handleImpersonate(uid: string) {
    setImpersonatingUid(uid);
    try {
      const res = await fetch("/api/admin/impersonation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetUid: uid, returnTo: window.location.pathname }),
      });
      const data = await res.json().catch(() => ({ error: "Failed to start impersonation." }));
      if (!res.ok) throw new Error(data.error || "Failed to start impersonation.");
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
        title="District & Regional Admins"
        subtitle="Manage users with district or regional administrative access."
      />

      <Card>
        <CardHeader>
          <CardTitle>District & Regional Admins</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search by name or email"
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
                  {OVERSIGHT_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role as OversightRole]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue placeholder="Newest first" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created-desc">Created: Newest first</SelectItem>
                  <SelectItem value="created-asc">Created: Oldest first</SelectItem>
                  <SelectItem value="name-asc">Name: A to Z</SelectItem>
                  <SelectItem value="name-desc">Name: Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk action toolbar */}
          {selectedCount > 0 && (
            <div className="rounded-md border p-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedCount} user(s) selected.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isBulkDeleting}>
                    {isBulkDeleting ? "Deleting..." : "Delete Selected"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete selected admins?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {selectedCount} selected account(s). Any
                      districts or regions they oversee must be reassigned. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete}>Confirm Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Table */}
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground">
              No district or regional admins found.
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
                        aria-label="Select all visible admins"
                      />
                    </th>
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Email</th>
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
                      onClick={() => router.push(`/admin/users/${u.uid}`)}
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
                      <td className="py-2 px-2">{u.email || "—"}</td>
                      <td className="py-2 px-2">
                        {u.roles.length > 0
                          ? u.roles.map((r) => ROLE_LABELS[r]).join(", ")
                          : "No roles"}
                      </td>
                      <td className="py-2 px-2">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          disabled={
                            currentUser?.uid === u.uid || impersonatingUid === u.uid
                          }
                          onClick={() => void handleImpersonate(u.uid)}
                        >
                          <LogIn className="h-4 w-4" />
                          {currentUser?.uid === u.uid
                            ? "Current User"
                            : impersonatingUid === u.uid
                            ? "Starting..."
                            : "Impersonate"}
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
