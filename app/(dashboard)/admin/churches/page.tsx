"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/app/lib/firebase/client";

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

import Link from "next/link";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent } from "@/app/components/ui/card";
import { PageHeader } from "@/app/components/page-header";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/app/components/ui/select";

import type { Church } from "@/app/lib/types";
import { formatPhone } from "@/app/lib/formatters";

export default function GlobalChurchListPage() {
  const PAGE_SIZE = 10;

  // -----------------------------
  // STATE
  // -----------------------------
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "createdAt">("name");

  // -----------------------------
  // LOAD INITIAL DATA
  // -----------------------------
  useEffect(() => {
    async function loadInitial() {
      setLoading(true);

      const ref = collection(db, "churches");
      const q = query(ref, orderBy(sortField), limit(PAGE_SIZE));

      const snap = await getDocs(q);

      const docs = snap.docs.map((d) => {
        const { id: _ignored, ...rest } = d.data() as Church;
        return { id: d.id, ...rest };
      });

      setChurches(docs);
      setLoading(false);
    }

    loadInitial();
  }, [sortField]);

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

      {/* Search + Sort */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
        <Input
          placeholder="Search churches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />

        <Select
          value={sortField}
          onValueChange={(v) => setSortField(v as "name" | "createdAt")}
        >
          <SelectTrigger
            className="
              w-[140px] h-9
              bg-black/80 border border-white/20 backdrop-blur-xl
              text-white/80
              hover:bg-white/5 hover:border-white/20
              transition
            "
          >
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="createdAt">Sort by Created Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Church Grid */}
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No churches found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((church) => (
            <Card
              key={church.id}
              className="hover:shadow-md transition bg-black/40 border border-white/10 backdrop-blur-xl"
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
                          border border-white/20 bg-white shadow-md
                        "
                      />
                    ) : (
                      <div
                        className="
                          h-20 w-20 rounded-md flex items-center justify-center 
                          bg-white/10 border border-white/20 text-xl font-semibold
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

                {/* View Button */}
                <div className="flex justify-center pt-4">
                  <Link
                    href={`/admin/churches/${church.id}`}
                    className="
                      px-4 py-2 rounded-md border
                      bg-muted/20 hover:bg-muted transition
                      text-sm
                    "
                  >
                    View Details →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
