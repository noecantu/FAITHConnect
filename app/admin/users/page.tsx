"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

import { PageHeader } from "@/app/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import { ROLE_MAP, ALL_ROLES, Role } from '@/app/lib/roles';

type UserRecord = {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  roles: Role[];
  churchId?: string;
  createdAt?: string;
};

type ChurchRecord = {
  id: string;
  name: string;
};

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [churches, setChurches] = useState<ChurchRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedChurch, setSelectedChurch] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<"all" | Role>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Load users
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef, orderBy("createdAt", "desc"));
      const usersSnap = await getDocs(usersQuery);

      const userData: UserRecord[] = usersSnap.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          email: data.email ?? "",
          roles: Array.isArray(data.roles) ? data.roles : [],
          churchId: data.churchId ?? "",
          createdAt: data.createdAt ?? "",
        };
      });

      // Load churches (for name + filter)
      const churchesRef = collection(db, "churches");
      const churchesSnap = await getDocs(churchesRef);
      const churchData: ChurchRecord[] = churchesSnap.docs.map((docSnap) => {
        const data = docSnap.data() as any;
        return {
          id: docSnap.id,
          name: data.name ?? "(Unnamed Church)",
        };
      });

      setUsers(userData);
      setChurches(churchData);
      setLoading(false);
    }

    load();
  }, []);

  const churchNameById = useMemo(() => {
    const map: Record<string, string> = {};
    churches.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [churches]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase();
      const email = (u.email ?? "").toLowerCase();
      const term = search.toLowerCase().trim();

      if (term && !fullName.includes(term) && !email.includes(term)) {
        return false;
      }

      if (selectedChurch !== "all" && u.churchId !== selectedChurch) {
        return false;
      }

      if (selectedRole !== "all" && !u.roles.includes(selectedRole)) {
        return false;
      }

      return true;
    });
  }, [users, search, selectedChurch, selectedRole]);

  function handleRowClick(userId: string) {
    router.push(`/admin/users/${userId}`);
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Users"
        subtitle="View and manage system-level users."
      />

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
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

              {/* Church Filter */}
              <div className="space-y-1">
                <Label>Church</Label>
                <Select
                  value={selectedChurch}
                  onValueChange={(val) => setSelectedChurch(val)}
                >
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="All churches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All churches</SelectItem>
                    {churches.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Role Filter */}
              <div className="space-y-1">
                <Label>Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(val) => setSelectedRole(val as "all" | Role)}
                >
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="All roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {ALL_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_MAP[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Create User */}
            <Button onClick={() => router.push("/admin/users/create")}>
              Create User
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-8 text-sm text-muted-foreground">
              Loading users…
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-sm text-muted-foreground">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Email</th>
                    <th className="text-left py-2 px-2">Church</th>
                    <th className="text-left py-2 px-2">Roles</th>
                    <th className="text-left py-2 px-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b hover:bg-muted/40 cursor-pointer"
                      onClick={() => handleRowClick(u.id)}
                    >
                      <td className="py-2 px-2">
                        {(u.firstName ?? "") || (u.lastName ?? "")
                          ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                          : "(No name)"}
                      </td>
                      <td className="py-2 px-2">{u.email}</td>
                      <td className="py-2 px-2">
                        {u.churchId
                          ? churchNameById[u.churchId] ?? u.churchId
                          : "Unassigned"}
                      </td>
                      <td className="py-2 px-2">
                        {u.roles.length
                          ? u.roles.map((r) => ROLE_MAP[r] ?? r).join(", ")
                          : "No roles"}
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
