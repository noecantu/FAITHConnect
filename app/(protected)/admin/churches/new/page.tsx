"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { auth } from "@/app/lib/firebase-client";
import { slugify } from "@/app/lib/slugify";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";

export default function NewChurchPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateUniqueSlug(base: string) {
    let slug = base;
    let counter = 1;

    while (true) {
      const ref = doc(db, "churches", slug);
      const snap = await getDoc(ref);

      if (!snap.exists()) return slug;

      counter++;
      slug = `${base}-${counter}`;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const baseSlug = slugify(name);
      const slug = await generateUniqueSlug(baseSlug);

      await setDoc(doc(db, "churches", slug), {
        name,
        slug,
        timezone,
        address: address || null,
        logoUrl: logoUrl || null,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid ?? null,
        settings: {},
      });

      const tempPassword = Math.random().toString(36).slice(2, 10);
      const userCred = await createUserWithEmailAndPassword(
        auth,
        adminEmail,
        tempPassword
      );

      const uid = userCred.user.uid;

      await setDoc(doc(db, "users", uid), {
        email: adminEmail,
        roles: ["Admin"],
        churchId: slug,
        createdAt: serverTimestamp(),
      });

      await sendPasswordResetEmail(auth, adminEmail);

      router.push(`/admin/churches/${slug}`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong creating the church.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-black">
      <Card className="w-full max-w-lg bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Create New Church</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="name">Church Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo URL (optional)</Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminEmail">First Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Church"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
