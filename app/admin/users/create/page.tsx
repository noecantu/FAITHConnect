"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

import { PageHeader } from "@/app/components/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";
import { useToast } from "@/app/hooks/use-toast";

import { ALL_ROLES, ROLE_MAP, Role } from "@/app/lib/roles";

export default function CreateUserPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);
  const [selectedChurch, setSelectedChurch] = useState<string>("");

  const [loading, setLoading] = useState(false);

  // Load churches for dropdown
  useEffect(() => {
    async function loadChurches() {
      const snap = await getDocs(collection(db, "churches"));
      const list = snap.docs.map((d) => ({
        id: d.id,
        name: (d.data() as any).name ?? "(Unnamed Church)",
      }));
      setChurches(list);
    }

    loadChurches();
  }, []);

  function handleRoleChange(role: Role, checked: boolean) {
    if (checked) {
      setSelectedRoles((prev) => [...prev, role]);
    } else {
      setSelectedRoles((prev) => prev.filter((r) => r !== role));
    }
  }

  async function handleCreateUser() {
    try {
      setLoading(true);

      if (!selectedChurch) {
        toast({
          title: "Missing Church",
          description: "Please select a church for this user.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 1. Create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // 2. Create Firestore user document
      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        roles: selectedRoles,
        churchId: selectedChurch,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "User Created",
        description: "The new user has been added successfully.",
      });

      router.push("/admin/users");
    } catch (err: any) {
      console.error("Failed to create user:", err);

      toast({
        title: "Error",
        description: err.message || "Could not create user.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Create User Account"
        subtitle="Add a new system-level user."
      />

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">

          {/* First Name */}
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
            />
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Church Selector */}
          <div className="space-y-2">
            <Label>Church</Label>
            <Select
              value={selectedChurch}
              onValueChange={(val) => setSelectedChurch(val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a church" />
              </SelectTrigger>
              <SelectContent>
                {churches.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Roles */}
          <div className="space-y-4">
            <h4 className="text-md font-bold">Roles & Permissions</h4>
            <div className="space-y-2">
              {ALL_ROLES.map((role) => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={(checked) =>
                      handleRoleChange(role, !!checked)
                    }
                  />
                  <Label>{ROLE_MAP[role]}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button
            className="w-full mt-4"
            onClick={handleCreateUser}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create User"}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
