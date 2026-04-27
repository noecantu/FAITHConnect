"use client";

import { useEffect, useState, useMemo } from "react";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { useRouter } from "next/navigation";

import Link from "next/link";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";
import { PageHeader } from "@/app/components/page-header";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import TimezoneSelect from "@/app/components/settings/TimezoneSelect";
import { useToast } from "@/app/hooks/use-toast";
import { Plus, X } from "lucide-react";

import type { Church } from "@/app/lib/types";
import { formatPhone } from "@/app/lib/formatters";

export default function GlobalChurchListPage() {
  const PAGE_SIZE = 10;
  const router = useRouter();
  const { toast } = useToast();

  // -----------------------------
  // STATE
  // -----------------------------
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortField] = useState<"name" | "createdAt">("name");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [churchName, setChurchName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [saving, setSaving] = useState(false);

  // -----------------------------
  // LOAD INITIAL DATA
  // -----------------------------
  useEffect(() => {
    async function loadInitial() {
      setLoading(true);

      const supabase = getSupabaseClient();
      const ascending = true;
      let queryBuilder = supabase
        .from("churches")
        .select("*")
        .order(sortField === "name" ? "name" : "created_at", { ascending })
        .limit(PAGE_SIZE);

      const { data } = await queryBuilder;
      setChurches(
        (data ?? []).map((row) => ({
          ...row,
          logoUrl: row.logo_url ?? row.logoUrl ?? null,
          leaderName: row.leader_name ?? row.leaderName ?? null,
          leaderTitle: row.leader_title ?? row.leaderTitle ?? null,
        })) as unknown as Church[]
      );
      setLoading(false);
    }

    loadInitial();
  }, [sortField]);

  // -----------------------------
  // CREATE CHURCH
  // -----------------------------
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!churchName.trim() || !timezone) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/churches", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: churchName.trim(),
          timezone,
          address: address.trim() || null,
          logo_url: logoUrl.trim() || null,
          adminEmail: adminEmail.trim() || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Create failed");
      }

      const body = await res.json();

      if (body.warning) {
        toast({ title: "Church Created", description: body.warning, variant: "destructive" });
      } else {
        toast({
          title: "Church Created",
          description: `${churchName.trim()} has been added.${adminEmail.trim() ? " Invite sent." : ""}`,
        });
      }

      // Navigate to the new church's detail page
      router.push(`/admin/churches/${body.church.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------
  // SEARCH FILTER
  // -----------------------------
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return churches.filter((c) =>
      c.name?.toLowerCase().includes(term)
    );
  }, [churches, search]);

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <>
      <PageHeader
        title="All Churches"
        subtitle="Manage every church in the FAITH Connect system."
      />

      {/* Search + New */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
        <Input
          placeholder="Search churches..."
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
            <><Plus className="h-4 w-4" /> New Church</>
          )}
        </Button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card className="border-white/15 bg-black/40 backdrop-blur-xl">
          <CardContent className="p-6">
            <h2 className="text-base font-semibold mb-4">Create New Church</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="c-name">Church Name *</Label>
                <Input
                  id="c-name"
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  placeholder="e.g., Grace Community Church"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-timezone">Timezone *</Label>
                <TimezoneSelect value={timezone} onChange={setTimezone} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-address">Address</Label>
                <Input
                  id="c-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-logo">Logo URL (optional)</Label>
                <Input
                  id="c-logo"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="c-admin">Admin Email (optional — sends invite)</Label>
                <Input
                  id="c-admin"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@church.org"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" disabled={saving || !churchName.trim() || !timezone}>
                  {saving ? "Creating…" : "Create Church"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Church Grid */}
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No churches found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((church) => (
            <Link key={church.id} href={`/admin/churches/${church.id}`} className="group block">
              <Card
                className="
                  h-full interactive-card interactive-card-focus
                  bg-black/40 backdrop-blur-xl
                "
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                      {church.logoUrl ? (
                        <img
                          src={church.logoUrl}
                          alt={`${church.name} logo`}
                          className="
                            h-20 w-20 rounded-md object-cover 
                            interactive-card-media bg-white shadow-md
                          "
                        />
                      ) : (
                        <div
                          className="
                            h-20 w-20 rounded-md flex items-center justify-center 
                            bg-white/10 interactive-card-media text-xl font-semibold
                          "
                        >
                          {church.name?.[0]?.toUpperCase() ?? "C"}
                        </div>
                      )}
                    </div>

                    {/* Church Info */}
                    <div className="flex flex-col min-w-0 space-y-1">
                      <h2 className="text-lg font-semibold truncate">
                        {church.name}
                      </h2>

                      {(church.leaderTitle || church.leaderName) && (
                        <p className="text-sm text-muted-foreground truncate">
                          {church.leaderTitle ? church.leaderTitle + " " : ""}
                          {church.leaderName ?? ""}
                        </p>
                      )}

                      <p className="text-sm text-muted-foreground truncate">
                        Phone: {formatPhone(church.phone ?? undefined)}
                      </p>

                      <p className="text-sm text-muted-foreground truncate">
                        Address: {church.address ?? "N/A"}
                      </p>

                      <p className="text-xs text-muted-foreground truncate">
                        Timezone: {church.timezone}
                      </p>

                      <p className="text-xs text-muted-foreground truncate">
                        Created:{" "}
                        {church.createdAt
                          ? (() => {
                              const value =
                                church.createdAt as Date | { seconds: number };

                              if ("seconds" in value) {
                                return new Date(
                                  value.seconds * 1000
                                ).toLocaleDateString();
                              }

                              if (value instanceof Date) {
                                return value.toLocaleDateString();
                              }

                              return "—";
                            })()
                          : "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
