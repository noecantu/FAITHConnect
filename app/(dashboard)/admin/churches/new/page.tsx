"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { slugify } from "@/app/lib/slugify";

import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Button } from "@/app/components/ui/button";

export default function NewChurchPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();

  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [address, setAddress] = useState("");
  const [logo_url, setLogoUrl] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateUniqueSlug(base: string) {
    let slug = base;
    let counter = 1;

    while (true) {
      const { data } = await supabase
        .from("churches")
        .select("id")
        .eq("id", slug)
        .maybeSingle();

      if (!data) return slug;

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

      const currentUser = (await supabase.auth.getUser()).data.user;

      const { error: churchError } = await supabase.from("churches").insert({
        id: slug,
        name,
        slug,
        timezone,
        address: address || null,
        logo_url: logo_url || null,
        created_at: new Date().toISOString(),
        created_by: currentUser?.id ?? null,
        settings: {},
      });

      if (churchError) throw churchError;

      // Create admin user via API route (server-side auth creation)
      const res = await fetch("/api/church-users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminEmail,
          firstName: "",
          lastName: "",
          roles: ["Admin"],
          churchId: slug,
          sendInvite: true,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to create admin user");
      }

      router.push(`/admin/churches/${slug}`);
    } catch (err) {
      console.error(err);
      alert("Something went wrong creating the church.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
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
              <Label htmlFor="logo_url">Logo URL (optional)</Label>
              <Input
                id="logo_url"
                value={logo_url}
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
    </>
  );
}
