"use client";

import { useEffect, useState } from "react";
import { useChurchId } from "@/app/hooks/useChurchId";
import { listenToMembers } from "@/app/lib/members";
import type { Member } from "@/app/lib/types";

export function useMembers() {
  const { churchId, loading: churchLoading } = useChurchId();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (churchLoading) return;

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

    return () => unsubscribe?.();
  }, [churchId, churchLoading]);

  return { members, loading };
}
