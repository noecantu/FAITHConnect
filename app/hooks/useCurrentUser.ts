import { useState, useEffect } from "react";
import type { AppUser } from "@/app/lib/types";
import { fetchCurrentUserCached } from "@/app/lib/currentUserCache";

export function useCurrentUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUserCached()
      .then((data) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
