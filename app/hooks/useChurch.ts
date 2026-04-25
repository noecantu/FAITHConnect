import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useChurch(churchId: string | undefined) {
  const [church, setChurch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    async function fetchChurch() {
      const { data, error } = await supabase
        .from("churches")
        .select("*")
        .eq("id", churchId)
        .single();

      if (!error) {
        setChurch(data);
      }
      setLoading(false);
    }

    fetchChurch();
  }, [churchId]);

  return { church, loading };
}
