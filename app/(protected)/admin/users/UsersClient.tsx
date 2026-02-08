"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

import { SystemRole } from "@/app/lib/system-roles";
import { SYSTEM_ROLE_MAP } from "@/app/lib/system-role-map";

// -----------------------------
// Types
// -----------------------------
export type UserRecord = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roles: SystemRole[]; // ← system-level roles only
  churchId?: string | null;
  createdAt?: string | number | Date | null;
};

type UsersClientProps = {
  users: UserRecord[];
};

// System-level roles
const SYSTEM_ROLES: SystemRole[] = [
  "RootAdmin",
  "SystemAdmin",
  "Support",
  "Auditor",
];

// -----------------------------
// Component
// -----------------------------
export default function UsersClient({ users }: UsersClientProps) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  // Only system-level users
  const systemUsers = useMemo(
    () => users.filter((u) => u.roles.some((r) => SYSTEM_ROLES.includes(r))),
    [users]
  );

  // Filter users
  const filteredUsers = useMemo(() => {
    return systemUsers.filter((u) => {
      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const term = search.toLowerCase().trim();

      if (term && !fullName.includes(term) && !email.includes(term)) return false;
      if (selectedRole !== "all" && !u.roles.includes(selectedRole as SystemRole))
        return false;

      return true;
    });
  }, [systemUsers, search, selectedRole]);

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="System Users"
        subtitle="Manage users with system-level access to FAITH Connect."
      />

      <Card>
        <CardHeader>
          <CardTitle>All System Users</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col md:flex-row gap-4 md:items-end">
              {/* Search */}
              <div className="space-y-1">
                <Label>Search</Label>
                <Input
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full md:w-64"
                />
              </div>

              {/* Role Filter */}
              <div className="space-y-1">
                <Label>Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(val) => setSelectedRole(val)}
                >
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {SYSTEM_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {SYSTEM_ROLE_MAP[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={() => router.push("/admin/users/create")}>
              Create User
            </Button>
          </div>

          {/* Table */}
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground">
              No system users found.
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
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b hover:bg-muted/40 cursor-pointer"
                      onClick={() => router.push(`/admin/users/${u.id}`)}
                    >
                      <td className="py-2 px-2">
                        {u.firstName || u.lastName
                          ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                          : "(No name)"}
                      </td>
                      <td className="py-2 px-2">{u.email}</td>
                      <td className="py-2 px-2">
                        {u.roles.map((r) => SYSTEM_ROLE_MAP[r]).join(", ")}
                      </td>
                      <td className="py-2 px-2">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
