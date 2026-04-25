import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useContributionHistorySettings(churchId: string | undefined) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    async function fetchSettings() {
      const { data, error } = await supabase
        .from("churches")
        .select("settings")
        .eq("id", churchId)
        .single();

      if (!error && data) {
        setSettings(data.settings?.contributionHistory || {});
      }
      setLoading(false);
    }

    fetchSettings();
  }, [churchId]);

  const updateSettings = async (newSettings: any) => {
    if (!churchId) return;
    const { data: current } = await supabase
      .from("churches")
      .select("settings")
      .eq("id", churchId)
      .maybeSingle();
    const updated = { ...current?.settings, contributionHistory: newSettings };
    const { error } = await supabase.from("churches").update({ settings: updated }).eq("id", churchId);
    if (!error) setSettings(newSettings);
    return { error };
  };

  return { settings, loading, updateSettings };
}
