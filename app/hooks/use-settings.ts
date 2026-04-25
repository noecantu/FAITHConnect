import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useSettings(churchId: string | undefined) {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    async function fetchSettings() {
      const { data, error } = await supabase
        .from("churches")
        .select("settings")
        .eq("id", churchId)
        .single();

      if (!error && data) {
        setSettings(data.settings ?? {});
      }
      setLoading(false);
    }

    fetchSettings();
  }, [churchId]);

  return { settings, loading };
}
