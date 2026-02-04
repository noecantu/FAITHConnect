"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "@/app/lib/firebase";
import { slugify } from "@/app/lib/slugify";
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

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
      // 1. Generate slug
      const baseSlug = slugify(name);
      const slug = await generateUniqueSlug(baseSlug);

      // 2. Create church document
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

      // 3. Create first admin user
      const tempPassword = Math.random().toString(36).slice(2, 10);
      const userCred = await createUserWithEmailAndPassword(
        auth,
        adminEmail,
        tempPassword
      );

      const uid = userCred.user.uid;

      // 4. Create Firestore user document
      await setDoc(doc(db, "users", uid), {
        email: adminEmail,
        roles: ["Admin"],
        churchId: slug,
        createdAt: serverTimestamp(),
      });

      // 5. Send password reset email
      await sendPasswordResetEmail(auth, adminEmail);

      // 6. Redirect to church dashboard
      router.push(`/admin/churches/${slug}`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong creating the church.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Church</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Church Name</label>
          <input
            className="w-full border p-2 rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1">Timezone</label>
          <input
            className="w-full border p-2 rounded"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1">Address (optional)</label>
          <input
            className="w-full border p-2 rounded"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Logo URL (optional)</label>
          <input
            className="w-full border p-2 rounded"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">First Admin Email</label>
          <input
            type="email"
            className="w-full border p-2 rounded"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded"
        >
          {loading ? "Creating..." : "Create Church"}
        </button>
      </form>
    </div>
  );
}
