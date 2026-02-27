"use client";

import { useEffect, useState } from "react";
import { listenToMembers } from "@/app/lib/members";
import type { Member } from "@/app/lib/types";

export function useMembers(churchId: string | null) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = listenToMembers(churchId, (loaded) => {
      setMembers(loaded);
      setLoading(false);
    });

    return () => {
      unsubscribe?.();
    };
  }, [churchId]);

  return { members, loading };
}
