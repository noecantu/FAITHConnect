"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/app/lib/firebase";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore";

import Link from "next/link";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";
import { PageHeader } from "@/app/components/page-header";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/components/ui/select";

export default function GlobalChurchListPage() {
  const PAGE_SIZE = 10;

  const [churches, setChurches] = useState<any[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [firstDoc, setFirstDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "createdAt">("name");

  async function loadInitial() {
    setLoading(true);

    const ref = collection(db, "churches");
    const q = query(ref, orderBy(sortField), limit(PAGE_SIZE));

    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    setChurches(docs);
    setFirstDoc(snap.docs[0] || null);
    setLastDoc(snap.docs[snap.docs.length - 1] || null);
    setLoading(false);
  }

  async function loadNext() {
    if (!lastDoc) return;

    setLoading(true);

    const ref = collection(db, "churches");
    const q = query(ref, orderBy(sortField), startAfter(lastDoc), limit(PAGE_SIZE));

    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (docs.length > 0) {
      setChurches(docs);
      setFirstDoc(snap.docs[0]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
    }

    setLoading(false);
  }

  async function loadPrevious() {
    if (!firstDoc) return;

    setLoading(true);

    const ref = collection(db, "churches");
    const q = query(ref, orderBy(sortField), limit(PAGE_SIZE));

    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    setChurches(docs);
    setFirstDoc(snap.docs[0]);
    setLastDoc(snap.docs[snap.docs.length - 1]);

    setLoading(false);
  }

  useEffect(() => {
    loadInitial();
  }, [sortField]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return churches.filter((c) => c.name?.toLowerCase().includes(term));
  }, [churches, search]);

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="All Churches"
        subtitle="Manage every church in the FAITH Connect system."
      />

      {/* Search + Sort */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">

        {/* Search bar — full width */}
        <div className="flex-1">
          <Input
            placeholder="Search churches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Sort dropdown — fixed width, right side */}
        <div className="w-full md:w-48">
          <Select
            value={sortField}
            onValueChange={(v) => setSortField(v as "name" | "createdAt")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="createdAt">Sort by Created Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>

      {/* Church Grid */}
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">No churches found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((church) => (
            <Card key={church.id} className="hover:shadow-md transition">
              <CardHeader>
                <CardTitle className="text-xl">{church.name}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Timezone:</span>{" "}
                  {church.timezone || "—"}
                </p>

                <p>
                  <span className="font-medium">Created:</span>{" "}
                  {church.createdAt
                    ? new Date(church.createdAt.seconds * 1000).toLocaleDateString()
                    : "—"}
                </p>

                <div className="pt-2">
                  <Link
                    href={`/admin/churches/${church.id}`}
                    className="text-primary hover:underline font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {/* <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={loadPrevious} disabled={loading}>
          Previous
        </Button>

        <Button variant="outline" onClick={loadNext} disabled={loading}>
          Next
        </Button>
      </div> */}
    </div>
  );
}
