"use client";

import { useEffect, useState } from "react";
import { useMemberPortal } from "../MemberPortalContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { Card, CardContent } from "@/app/components/ui/card";
import { format } from "date-fns";
import { Link } from "lucide-react";

type Contribution = {
  id: string;
  amount: number;
  date: string;
  fund?: string;
  method?: string;
};

export default function MemberPortalContributions() {
  const { member, churchId } = useMemberPortal();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContributions() {
      const ref = collection(db, "churches", churchId, "contributions");
      const q = query(ref, where("memberId", "==", member.id));
      const snap = await getDocs(q);

      const items = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Contribution[];

      // Sort newest first
      items.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setContributions(items);
      setLoading(false);
    }

    loadContributions();
  }, [churchId, member.id]);

  if (loading) {
    return <p className="text-white/70">Loading your contributions…</p>;
  }

  if (contributions.length === 0) {
    return (
      <p className="text-white/60">
        You have no recorded contributions.
      </p>
    );
  }

  // Totals
  const lifetimeTotal = contributions.reduce((sum, c) => sum + c.amount, 0);

  const currentYear = new Date().getFullYear();
  const ytdTotal = contributions
    .filter((c) => new Date(c.date).getFullYear() === currentYear)
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
         <Link href="/member-portal/home" className="text-white/60 text-sm hover:text-white/90">
            ← Back to Home
        </Link>

      {/* Totals */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6 flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-white/90">
            Giving Summary
          </h3>

          <p className="text-white/70 text-sm">
            Year‑to‑date:{" "}
            <span className="text-white font-medium">
              ${ytdTotal.toFixed(2)}
            </span>
          </p>

          <p className="text-white/70 text-sm">
            Lifetime Total:{" "}
            <span className="text-white font-medium">
              ${lifetimeTotal.toFixed(2)}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Contribution List */}
      <div className="flex flex-col gap-4">
        {contributions.map((c) => (
          <Card
            key={c.id}
            className="bg-white/5 border-white/10 backdrop-blur-sm"
          >
            <CardContent className="p-4 flex flex-col gap-2">
              <h4 className="text-white/90 font-medium">
                {format(new Date(c.date), "MMMM d, yyyy")}
              </h4>

              <p className="text-white/70 text-sm">
                Amount:{" "}
                <span className="text-white font-semibold">
                  ${c.amount.toFixed(2)}
                </span>
              </p>

              {c.fund && (
                <p className="text-white/60 text-sm">Fund: {c.fund}</p>
              )}

              {c.method && (
                <p className="text-white/60 text-sm">Method: {c.method}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
