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
        .select("*")
        .eq("id", userId)
        .single();

      if (!error && data) {
        const settingsBlob =
          typeof data.settings === "object" && data.settings !== null
            ? data.settings
            : {};

        // Backward compatible read: prefer new JSON settings, fall back to legacy key if present.
        const calendarSettings =
          typeof (settingsBlob as Record<string, unknown>).calendarSettings === "object" &&
          (settingsBlob as Record<string, unknown>).calendarSettings !== null
            ? (settingsBlob as Record<string, unknown>).calendarSettings
            : (data as Record<string, unknown>).calendar_settings ?? {};

        setSettings(calendarSettings);
      }
      setLoading(false);
    }

    fetchSettings();
  }, [userId]);

  const updateSettings = async (newSettings: any) => {
    if (!userId) return;

    const { data: current } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    const existing =
      current && typeof current.settings === "object" && current.settings !== null
        ? current.settings
        : {};

    const mergedSettings = {
      ...(existing as Record<string, unknown>),
      calendarSettings: newSettings,
    };

    const { error } = await supabase
      .from("users")
      .update({ settings: mergedSettings })
      .eq("id", userId);
    
    if (!error) setSettings(newSettings);
    return { error };
  };

  return { settings, loading, updateSettings };
}
