import { useState, useEffect } from 'react';

const LOCAL_CALENDAR_SETTINGS_KEY = "calendarSettings";

function readLocalCalendarSettings(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(LOCAL_CALENDAR_SETTINGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function writeLocalCalendarSettings(value: unknown): void {
  try {
    localStorage.setItem(LOCAL_CALENDAR_SETTINGS_KEY, JSON.stringify(value));
  } catch {}
}

export function useUserCalendarSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function fetchSettings() {
      try {
        const localSettings = readLocalCalendarSettings();

        const res = await fetch("/api/users/me", { credentials: "include" });
        const data = res.ok ? await res.json() : null;

        if (data) {
          const settingsBlob =
            typeof data.settings === "object" && data.settings !== null
              ? data.settings
              : {};

          // Backward compatible read: prefer new JSON settings, fall back to legacy key if present.
          const calendarSettings =
            typeof (settingsBlob as Record<string, unknown>).calendarSettings === "object" &&
            (settingsBlob as Record<string, unknown>).calendarSettings !== null
              ? (settingsBlob as Record<string, unknown>).calendarSettings
              : (data as Record<string, unknown>).calendar_settings ?? localSettings;

          setSettings(calendarSettings);
          writeLocalCalendarSettings(calendarSettings);
        } else {
          setSettings(localSettings);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [userId]);

  const updateSettings = async (newSettings: any) => {
    if (!userId) return;

    writeLocalCalendarSettings(newSettings);

    try {
      const res = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ calendarSettings: newSettings }),
      });

      if (res.ok) {
        setSettings(newSettings);
        return { error: null };
      }

      const body = await res.json().catch(() => ({}));
      const message =
        typeof body?.error === "string"
          ? body.error
          : `Failed to update calendar settings (${res.status})`;

      return { error: { message } };
    } catch {
      setSettings(newSettings);
      return { error: { message: "Failed to update calendar settings" } };
    }
  };

  return { settings, loading, updateSettings };
}
