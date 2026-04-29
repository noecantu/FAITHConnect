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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";
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

import { ROLE_LABELS, type Role } from "@/app/lib/auth/roles";

const OVERSIGHT_ROLES = ["DistrictAdmin", "RegionalAdmin"] as const;
type OversightRole = (typeof OVERSIGHT_ROLES)[number];

export type UserRecord = {
  uid: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roles: Role[];
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
  const [deletingUid, setDeletingUid] = useState<string | null>(null);
  const [impersonatingUid, setImpersonatingUid] = useState<string | null>(null);

  async function deleteUser(uid: string) {
    const res = await fetch("/api/system-users/delete", {
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

  async function handleDelete(uid: string) {
    setDeletingUid(uid);

    try {
      await deleteUser(uid);

      toast({
        title: "User Deleted",
        description: "The admin user has been removed.",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete user.",
      });
    } finally {
      setDeletingUid(null);
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

  const oversightUsers = useMemo(
    () =>
      users.filter((u) =>
        u.roles.some((r) => (OVERSIGHT_ROLES as readonly string[]).includes(r))
      ),
    [users]
  );

  const filteredUsers = useMemo(() => {
    return oversightUsers.filter((u) => {
      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const term = search.toLowerCase().trim();

      if (term && !fullName.includes(term) && !email.includes(term)) return false;
      if (selectedRole !== "all" && !u.roles.includes(selectedRole as Role)) return false;

      return true;
    });
  }, [oversightUsers, search, selectedRole]);

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
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col md:flex-row gap-4 md:items-end">
              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full md:w-64"
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val)}>
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
            </div>
          </div>

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
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Email</th>
                    <th className="text-left py-2 px-2">Roles</th>
                    <th className="text-left py-2 px-2">Created</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.uid}
                      className="border-b border-white/10 cursor-pointer transition-all hover:bg-sky-950/40 hover:shadow-[inset_0_0_0_1px_rgba(56,189,248,0.5)]"
                      onClick={() => router.push(`/admin/users/${u.uid}`)}
                    >
                      <td className="py-2 px-2">
                        {u.firstName || u.lastName
                          ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                          : "(No name)"}
                      </td>
                      <td className="py-2 px-2">{u.email}</td>
                      <td className="py-2 px-2">
                        {u.roles.map((r) => ROLE_LABELS[r]).join(", ")}
                      </td>
                      <td className="py-2 px-2">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
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

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={
                                  deletingUid === u.uid || currentUser?.uid === u.uid
                                }
                              >
                                {currentUser?.uid === u.uid
                                  ? "Current User"
                                  : deletingUid === u.uid
                                  ? "Deleting..."
                                  : "Delete"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this admin user?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This permanently deletes the login for {u.email}. Any
                                  districts or regions they oversee must be reassigned first.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(u.uid)}>
                                  Confirm Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
