//app/(dashboard)/admin/district/users/page.tsx
"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { usePermissions } from "@/app/hooks/usePermissions";
import { getUsersByChurchIds } from "@/app/lib/regional-users";
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
        // 1. Load regions in this district
        const regionsSnap = await getDocs(
          query(collection(db, "regions"), where("districtId", "==", districtId))
        );
        const regionIds = regionsSnap.docs.map((d) => d.id);

        if (regionIds.length === 0) {
          if (active) { setUsers([]); setLoading(false); }
          return;
        }

        // 2. Load churches in those regions
        const churchIds: string[] = [];
        const churchNameMap: Record<string, string> = {};

        await Promise.all(
          regionIds.map(async (rid) => {
            const churchSnap = await getDocs(
              query(collection(db, "churches"), where("regionId", "==", rid))
            );
            churchSnap.docs.forEach((d) => {
              churchIds.push(d.id);
              churchNameMap[d.id] = d.data().name || d.id;
            });
          })
        );

        if (churchIds.length === 0) {
          if (active) { setUsers([]); setLoading(false); }
          return;
        }

        // 3. Load users in those churches
        const rawUsers = await getUsersByChurchIds(churchIds);

        if (!active) return;

        const enriched: DistrictUser[] = rawUsers.map((u) => ({
          ...u,
          churchName: u.churchId ? (churchNameMap[u.churchId] ?? u.churchId) : undefined,
        }));

        setUsers(enriched);
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
        title="District Members"
        subtitle="All users across churches in your district."
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
        <p className="text-sm text-muted-foreground">Loading members…</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No members found.</p>
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
