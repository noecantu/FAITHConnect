"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { db } from "@/app/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import SelfCheckIn from "./SelfCheckIn";
import type { Church } from "@/app/lib/types";

export default function CheckInPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const churchId = params.churchId as string;
  const token = searchParams.get("t");
  const date = searchParams.get("d");

  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const q = query(
        collection(db, "churches"),
        where("slug", "==", churchId)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setChurch(null);
        setLoading(false);
        return;
      }

      const data = snapshot.docs[0].data();

      const churchData: Church = {
        id: snapshot.docs[0].id,
        name: data.name,
        slug: data.slug,
        timezone: data.timezone,
        logoUrl: data.logoUrl ?? null,
        description: data.description ?? null,
        status: data.status ?? null,
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      };

      setChurch(churchData);
      setLoading(false);
    }

    load();
  }, [churchId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-slate-200">Loading…</div>;
  }

  if (!church) {
    return <div className="min-h-screen flex items-center justify-center text-slate-200">Church not found.</div>;
  }

  if (!token || !date) {
    return <div className="min-h-screen flex items-center justify-center text-slate-200">Invalid check‑in link.</div>;
  }

  return <SelfCheckIn church={church} token={token} date={date} />;
}
