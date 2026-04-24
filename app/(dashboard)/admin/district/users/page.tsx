//app/(dashboard)/admin/district/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { usePermissions } from "@/app/hooks/usePermissions";
import { PageHeader } from "@/app/components/page-header";
import { Input } from "@/app/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";

type DistrictUser = {
  uid: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  roles?: string[];
  churchId?: string | null;
  churchName?: string;
};

export default function DistrictUsersPage() {
  const { isDistrictAdmin, districtId, loading: permLoading } = usePermissions();

  const [users, setUsers] = useState<DistrictUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!districtId) return;

    let active = true;

    const loadUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/district/users?districtId=${encodeURIComponent(districtId)}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to load district users (${res.status})`);
        }

        const data = (await res.json()) as { users?: DistrictUser[] };

        if (!active) return;

        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (err) {
        console.error("Error loading district users:", err);
        if (active) setUsers([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUsers();
    return () => { active = false; };
  }, [districtId]);

  const filtered = users.filter((u) => {
    const term = search.toLowerCase();
    const full = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
    return (
      full.includes(term) ||
      (u.email ?? "").toLowerCase().includes(term) ||
      (u.churchName ?? "").toLowerCase().includes(term)
    );
  });

  if (permLoading) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  if (!isDistrictAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Unauthorized</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Regional Users"
        subtitle="All user accounts across churches in your district's regions."
      />

      <div className="mb-4">
        <Input
          placeholder="Search by name, email, or church…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading users…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Church</TableHead>
              <TableHead>Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>
                  {user.firstName ?? ""} {user.lastName ?? ""}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.email ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.churchName ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {Array.isArray(user.roles) && user.roles.length > 0
                    ? user.roles.join(", ")
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
