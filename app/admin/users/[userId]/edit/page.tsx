"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";

import { PageHeader } from "@/app/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Checkbox } from "@/app/components/ui/checkbox";

import { ROLE_MAP, ALL_ROLES, Role } from "@/app/lib/roles";

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

export default function EditUserPage() {
  const params = useParams<{ userId: string }>();
  const router = useRouter();

  // Extract and validate userId
  const raw = params?.userId;
  const userId = Array.isArray(raw) ? raw[0] : raw;

  // ⭐ This is the ONLY correct way to narrow the type for Firestore
  if (typeof userId !== "string") {
    throw new Error("Invalid userId param");
  }

  const [user, setUser] = useState<UserRecord | null>(null);
  const [churches, setChurches] = useState<ChurchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [churchId, setChurchId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // ⭐ SAFE: userId is guaranteed string
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = userSnap.data() as any;

      const userData: UserRecord = {
        id: userSnap.id,
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        email: data.email ?? "",
        roles: Array.isArray(data.roles) ? data.roles : [],
        churchId: data.churchId ?? "",
        createdAt: data.createdAt ?? "",
      };

      setUser(userData);

      // Prefill form
      setFirstName(userData.firstName ?? "");
      setLastName(userData.lastName ?? "");
      setEmail(userData.email ?? "");
      setChurchId(userData.churchId ?? "");
      setRoles(userData.roles ?? []);

      // Load churches
      const churchesRef = collection(db, "churches");
      const churchesSnap = await getDocs(churchesRef);

      const churchList: ChurchRecord[] = churchesSnap.docs.map((docSnap) => {
        const d = docSnap.data() as any;
        return {
          id: docSnap.id,
          name: d.name ?? "(Unnamed Church)",
        };
      });

      setChurches(churchList);
      setLoading(false);
    }

    load();
  }, [userId]);

  async function handleSave() {
    if (!user) return;

    setSaving(true);

    try {
      // ⭐ SAFE: user.id is always a string
      const userRef = doc(db, "users", user.id);

      await updateDoc(userRef, {
        firstName,
        lastName,
        email,
        churchId,
        roles,
      });

      router.push(`/admin/users/${user.id}`);
    } catch (err) {
      console.error("Failed to update user:", err);
    } finally {
      setSaving(false);
    }
  }

  function toggleRole(role: Role) {
    setRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Edit User" subtitle="Loading user…" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 space-y-4">
        <PageHeader title="User Not Found" subtitle="This user does not exist." />
        <Button onClick={() => router.push("/admin/users")}>Back to Users</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Edit User"
        subtitle="Update system-level user details"
      />

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">

          {/* First Name */}
          <div className="space-y-1">
            <Label>First Name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          {/* Last Name */}
          <div className="space-y-1">
            <Label>Last Name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Church */}
          <div className="space-y-1">
            <Label>Church</Label>
            <select
              className="border rounded-md p-2 w-full"
              value={churchId}
              onChange={(e) => setChurchId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {churches.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Roles */}
          <div className="space-y-2">
            <Label>Roles</Label>

            <div className="space-y-2">
              {ALL_ROLES.map((role) => (
                <div key={role} className="flex items-center gap-2">
                  <Checkbox
                    checked={roles.includes(role)}
                    onCheckedChange={() => toggleRole(role)}
                  />
                  <span>{ROLE_MAP[role]}</span>
                </div>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Actions */}
      <div
        className="
          flex flex-col sm:flex-row
          justify-end
          gap-2
        "
      >
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => router.push(`/admin/users/${user.id}`)}
        >
          Cancel
        </Button>

        <Button
          className="w-full sm:w-auto"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
