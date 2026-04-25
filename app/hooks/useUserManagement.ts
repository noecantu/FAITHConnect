import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useUserManagement(churchId: string | undefined) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    async function fetchUsers() {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("church_id", churchId);

      if (!error) {
        setUsers(data || []);
      }
      setLoading(false);
    }

    fetchUsers();
  }, [churchId]);

  return { users, loading };
}
