//app/(dashboard)/admin/districts/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { PageHeader } from "@/app/components/page-header";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { useToast } from "@/app/hooks/use-toast";
import { MapPinned, Plus, X } from "lucide-react";

type District = {
  id: string;
  name: string;
  state?: string | null;
  logo_url?: string | null;
  region_admin_name?: string | null;
  region_admin_first_name?: string | null;
  region_admin_last_name?: string | null;
  region_admin_title?: string | null;
  created_at?: string;
};

export default function AdminDistrictsPage() {
  const { toast } = useToast();

  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [adminFirstName, setAdminFirstName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [adminTitle, setAdminTitle] = useState("");
  const [saving, setSaving] = useState(false);

  function getAdminFullName(d: District): string {
    const first = (d.region_admin_first_name ?? "").trim();
    const last = (d.region_admin_last_name ?? "").trim();
    const fromParts = [first, last].filter(Boolean).join(" ");
    return fromParts || (d.region_admin_name ?? "").trim();
  }

  async function loadDistricts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/districts", { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load districts (${res.status})`);
      const body = await res.json();
      setDistricts(Array.isArray(body.districts) ? body.districts : []);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Could not load districts.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDistricts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return districts.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        (d.state ?? "").toLowerCase().includes(term) ||
        getAdminFullName(d).toLowerCase().includes(term)
    );
  }, [districts, search]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/districts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          state: state.trim() || null,
          logo_url: logoUrl.trim() || null,
          region_admin_first_name: adminFirstName.trim() || null,
          region_admin_last_name: adminLastName.trim() || null,
          region_admin_title: adminTitle.trim() || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Create failed");
      }
      const body = await res.json();
      setDistricts((prev) => [body.district, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
      toast({ title: "District Created", description: `${name.trim()} has been added.` });
      setName("");
      setState("");
      setLogoUrl("");
      setAdminFirstName("");
      setAdminLastName("");
      setAdminTitle("");
      setShowCreate(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Districts"
        subtitle="All districts configured in the FAITH Connect platform."
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Input
          placeholder="Search districts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="outline"
          className="shrink-0 gap-2"
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? (
            <><X className="h-4 w-4" /> Cancel</>
          ) : (
            <><Plus className="h-4 w-4" /> New District</>
          )}
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="border-white/15 bg-black/40 backdrop-blur-xl">
          <CardContent className="p-6">
            <h2 className="text-base font-semibold mb-4">Create New District</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="d-name">District Name *</Label>
                <Input
                  id="d-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Southwest District"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-state">State</Label>
                <Input
                  id="d-state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g., Texas"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-admin-title">Admin Title</Label>
                <Input
                  id="d-admin-title"
                  value={adminTitle}
                  onChange={(e) => setAdminTitle(e.target.value)}
                  placeholder="e.g., Superintendent"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-admin-first-name">Admin First Name</Label>
                <Input
                  id="d-admin-first-name"
                  value={adminFirstName}
                  onChange={(e) => setAdminFirstName(e.target.value)}
                  placeholder="e.g., John"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-admin-last-name">Admin Last Name</Label>
                <Input
                  id="d-admin-last-name"
                  value={adminLastName}
                  onChange={(e) => setAdminLastName(e.target.value)}
                  placeholder="e.g., Smith"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="d-logo">Logo URL (optional)</Label>
                <Input
                  id="d-logo"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" disabled={saving || !name.trim()}>
                  {saving ? "Creating…" : "Create District"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <p className="text-muted-foreground">Loading districts…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">
          {search ? "No districts match your search." : "No districts found."}
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((district) => (
            <Card
              key={district.id}
              className="bg-black/40 backdrop-blur-xl border-white/10"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Logo / Initials */}
                  <div className="flex-shrink-0">
                    {district.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={district.logo_url}
                        alt={`${district.name} logo`}
                        className="h-14 w-14 rounded-md object-cover bg-white shadow-md"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-md flex items-center justify-center bg-white/10 text-lg font-semibold">
                        {district.name
                          .split(" ")
                          .map((w) => w[0]?.toUpperCase())
                          .join("")
                          .slice(0, 2) || "D"}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h3 className="font-semibold truncate">{district.name}</h3>
                    {district.state && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                        <MapPinned className="h-3 w-3 shrink-0" />
                        {district.state}
                      </p>
                    )}
                    {(district.region_admin_title || getAdminFullName(district)) && (
                      <p className="text-sm text-muted-foreground truncate">
                        {district.region_admin_title
                          ? `${district.region_admin_title}: `
                          : ""}
                        {getAdminFullName(district)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
