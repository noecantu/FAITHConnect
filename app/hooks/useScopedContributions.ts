"use client";

import { useEffect, useState } from "react";
import type { Contribution } from "@/app/lib/types";

type UseScopedContributionsProps = {
  enabled: boolean;
};

export function useScopedContributions({ enabled }: UseScopedContributionsProps) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    let active = true;

    if (!enabled) {
      setContributions([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);

      try {
        const res = await fetch("/api/reports/contributions", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed scoped contributions: ${res.status}`);
        }

        const data = (await res.json()) as { contributions?: Contribution[] };

        if (!active) return;
        setContributions(Array.isArray(data.contributions) ? data.contributions : []);
      } catch (error) {
        console.error("useScopedContributions error:", error);
        if (active) setContributions([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [enabled]);

  return { contributions, loading };
}
