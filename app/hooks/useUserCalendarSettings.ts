import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useUserCalendarSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchSettings() {
      const { data, error } = await supabase
        .from("users")
        .select("calendar_settings")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setSettings(data.calendar_settings || {});
      }
      setLoading(false);
    }

    fetchSettings();
  }, [userId]);

  const updateSettings = async (newSettings: any) => {
    if (!userId) return;
    const { error } = await supabase
      .from("users")
      .update({ calendar_settings: newSettings })
      .eq("id", userId);
    
    if (!error) setSettings(newSettings);
    return { error };
  };

  return { settings, loading, updateSettings };
}
