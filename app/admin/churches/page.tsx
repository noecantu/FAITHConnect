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

export default function GlobalChurchListPage() {
  const PAGE_SIZE = 10;

  const [churches, setChurches] = useState<any[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [firstDoc, setFirstDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"name" | "createdAt">("name");

  // -----------------------------
  // LOAD FIRST PAGE
  // -----------------------------
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

  // -----------------------------
  // NEXT PAGE
  // -----------------------------
  async function loadNext() {
    if (!lastDoc) return;

    setLoading(true);

    const ref = collection(db, "churches");
    const q = query(
      ref,
      orderBy(sortField),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );

    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (docs.length > 0) {
      setChurches(docs);
      setFirstDoc(snap.docs[0]);
      setLastDoc(snap.docs[snap.docs.length - 1]);
    }

    setLoading(false);
  }

  // -----------------------------
  // PREVIOUS PAGE
  // -----------------------------
  async function loadPrevious() {
    if (!firstDoc) return;

    setLoading(true);

    const ref = collection(db, "churches");
    const q = query(
      ref,
      orderBy(sortField),
      limit(PAGE_SIZE)
    );

    const snap = await getDocs(q);
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    setChurches(docs);
    setFirstDoc(snap.docs[0]);
    setLastDoc(snap.docs[snap.docs.length - 1]);

    setLoading(false);
  }

  // -----------------------------
  // RELOAD WHEN SORT CHANGES
  // -----------------------------
  useEffect(() => {
    loadInitial();
  }, [sortField]);

  // -----------------------------
  // SEARCH FILTER (client-side)
  // -----------------------------
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return churches.filter((c) =>
      c.name?.toLowerCase().includes(term)
    );
  }, [churches, search]);

  return (
    <div className="p-6 space-y-8">

      <div>
        <h1 className="text-3xl font-bold">All Churches</h1>
        <p className="text-muted-foreground">
          Manage every church in the FAITH Connect system.
        </p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Input
          placeholder="Search churches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2"
        />

        <select
          className="border rounded p-2"
          value={sortField}
          onChange={(e) =>
            setSortField(e.target.value as "name" | "createdAt")
          }
        >
          <option value="name">Sort by Name</option>
          <option value="createdAt">Sort by Created Date</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Churches</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p>Loading…</p>
          ) : filtered.length === 0 ? (
            <p>No churches found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Name</th>
                  <th className="text-left py-2">Timezone</th>
                  <th className="text-left py-2">Created</th>
                  <th className="text-left py-2"></th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((church) => (
                  <tr key={church.id} className="border-b">
                    <td className="py-2">{church.name}</td>
                    <td className="py-2">{church.timezone || "—"}</td>
                    <td className="py-2">
                      {church.createdAt
                        ? new Date(church.createdAt.seconds * 1000).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-2 text-right">
                      <Link
                        href={`/admin/churches/${church.id}`}
                        className="text-primary hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={loadPrevious} disabled={loading}>
          Previous
        </Button>

        <Button variant="outline" onClick={loadNext} disabled={loading}>
          Next
        </Button>
      </div>
    </div>
  );
}
