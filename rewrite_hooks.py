import os

FILES_TO_REWRITE = [
    "app/hooks/useAuth.ts",
    "app/hooks/useChurch.ts",
    "app/hooks/useCalendarEvents.ts",
    "app/hooks/use-settings.ts",
    "app/hooks/useUpcomingEvents.ts",
    "app/hooks/useUpcomingServices.ts",
    "app/hooks/useAttendance.ts",
    "app/hooks/useAttendanceHistory.ts",
    "app/hooks/useAttendanceForReports.ts",
    "app/hooks/useAttendanceHistorySettings.ts",
    "app/hooks/useContributionHistorySettings.ts",
    "app/hooks/useUserCalendarSettings.ts",
    "app/hooks/useCurrentUser.ts",
    "app/hooks/useUserManagement.ts",
    "app/hooks/useServicePlan.ts"
]

def write_use_auth():
    content = """//app/hooks/useAuth.ts
"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { AppUser } from "@/app/lib/types";

let logoutTransitionInProgress = false;
const logoutTransitionListeners = new Set<() => void>();

function emitLogoutTransitionChange() {
  logoutTransitionListeners.forEach((listener) => listener());
}

export function startLogoutTransition() {
  logoutTransitionInProgress = true;
  emitLogoutTransitionChange();
}

export function clearLogoutTransition() {
  if (!logoutTransitionInProgress) return;
  logoutTransitionInProgress = false;
  emitLogoutTransitionChange();
}

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(logoutTransitionInProgress);

  useEffect(() => {
    const listener = () => setLogoutLoading(logoutTransitionInProgress);
    logoutTransitionListeners.add(listener);
    return () => {
      logoutTransitionListeners.delete(listener);
    };
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data as AppUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      clearLogoutTransition();
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Check current session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setUser(null);
          if (!logoutTransitionInProgress) {
            setLoading(false);
          }
          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
          setLoading(true);
          await fetchProfile();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return { user, loading: loading || logoutLoading };
}
"""
    with open("app/hooks/useAuth.ts", "w") as f:
        f.write(content)
    print("app/hooks/useAuth.ts: success")

def process_files():
    # Helper to print errors
    def report_fail(filename, err):
        print(f"{filename}: failure - {err}")

    # File 1 handled separately
    write_use_auth()

    # File 2: useChurch.ts
    try:
        content = """import { useState, useEffect } from 'react';
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
"""
        with open("app/hooks/useChurch.ts", "w") as f: f.write(content)
        print("app/hooks/useChurch.ts: success")
    except Exception as e: report_fail("app/hooks/useChurch.ts", e)

    # File 3: useCalendarEvents.ts
    try:
        content = """import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useCalendarEvents(churchId: string | undefined) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("church_id", churchId);

      if (!error) {
        setEvents(data || []);
      }
      setLoading(false);
    }

    fetchEvents();
  }, [churchId]);

  return { events, loading };
}
"""
        with open("app/hooks/useCalendarEvents.ts", "w") as f: f.write(content)
        print("app/hooks/useCalendarEvents.ts: success")
    except Exception as e: report_fail("app/hooks/useCalendarEvents.ts", e)

    # File 4: use-settings.ts
    try:
        content = """import { useState, useEffect } from 'react';
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
"""
        with open("app/hooks/use-settings.ts", "w") as f: f.write(content)
        print("app/hooks/use-settings.ts: success")
    except Exception as e: report_fail("app/hooks/use-settings.ts", e)

    # File 5: useUpcomingEvents.ts
    try:
        content = """import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useUpcomingEvents(churchId: string | undefined) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("church_id", churchId)
        .gte("date_string", today)
        .order("date_string", { ascending: true });

      if (!error) {
        setEvents(data || []);
      }
      setLoading(false);
    }

    fetchEvents();
  }, [churchId]);

  return { events, loading };
}
"""
        with open("app/hooks/useUpcomingEvents.ts", "w") as f: f.write(content)
        print("app/hooks/useUpcomingEvents.ts: success")
    except Exception as e: report_fail("app/hooks/useUpcomingEvents.ts", e)

    # File 6: useUpcomingServices.ts
    try:
        content = """import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useUpcomingServices(churchId: string | undefined) {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    async function fetchServices() {
      const { data, error } = await supabase
        .from("service_plans")
        .select("*")
        .eq("church_id", churchId)
        .gte("date_string", today)
        .order("date_string", { ascending: true });

      if (!error) {
        setServices(data || []);
      }
      setLoading(false);
    }

    fetchServices();
  }, [churchId]);

  return { services, loading };
}
"""
        with open("app/hooks/useUpcomingServices.ts", "w") as f: f.write(content)
        print("app/hooks/useUpcomingServices.ts: success")
    except Exception as e: report_fail("app/hooks/useUpcomingServices.ts", e)

    # File 7: useAttendance.ts
    try:
        content = """import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useAttendance(churchId: string | undefined, dateString: string | undefined) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!churchId || !dateString) {
      setLoading(false);
      return;
    }

    async function fetchAttendance() {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("church_id", churchId)
        .eq("date_string", dateString);

      if (!error) {
        setAttendance(data || []);
      }
      setLoading(false);
    }

    fetchAttendance();
  }, [churchId, dateString]);

  const saveAttendance = async (records: any[]) => {
    if (!churchId || !dateString) return;
    
    const { error } = await supabase
      .from("attendance")
      .upsert(records.map(r => ({ ...r, church_id: churchId, date_string: dateString })));
    
    return { error };
  };

  return { attendance, loading, saveAttendance };
}
"""
        with open("app/hooks/useAttendance.ts", "w") as f: f.write(content)
        print("app/hooks/useAttendance.ts: success")
    except Exception as e: report_fail("app/hooks/useAttendance.ts", e)

    # File 8: useAttendanceHistory.ts
    try:
        content = """import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useAttendanceHistory(churchId: string | undefined) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    async function fetchHistory() {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("church_id", churchId)
        .order("date_string", { ascending: false });

      if (!error) {
        setHistory(data || []);
      }
      setLoading(false);
    }

    fetchHistory();
  }, [churchId]);

  return { history, loading };
}
"""
        with open("app/hooks/useAttendanceHistory.ts", "w") as f: f.write(content)
        print("app/hooks/useAttendanceHistory.ts: success")
    except Exception as e: report_fail("app/hooks/useAttendanceHistory.ts", e)

    # File 9: useAttendanceForReports.ts
    try:
        content = """import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useAttendanceForReports(churchId: string | undefined, startDate: string, endDate: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    async function fetchData() {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("church_id", churchId)
        .gte("date_string", startDate)
        .lte("date_string", endDate);

      if (!error) {
        setData(data || []);
      }
      setLoading(false);
    }

    fetchData();
  }, [churchId, startDate, endDate]);

  return { data, loading };
}
"""
        with open("app/hooks/useAttendanceForReports.ts", "w") as f: f.write(content)
        print("app/hooks/useAttendanceForReports.ts: success")
    except Exception as e: report_fail("app/hooks/useAttendanceForReports.ts", e)

    # File 10: useAttendanceHistorySettings.ts
    try:
        content = """import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useAttendanceHistorySettings(churchId: string | undefined) {
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
        setSettings(data.settings?.attendanceHistory || {});
      }
      setLoading(false);
    }

    fetchSettings();
  }, [churchId]);

  const updateSettings = async (newSettings: any) => {
    if (!churchId) return;
    const { data: current } = await supabase.from("churches").select("settings").eq("id", churchId).single();
    const updated = { ...current?.settings, attendanceHistory: newSettings };
    const { error } = await supabase.from("churches").update({ settings: updated }).eq("id", churchId);
    if (!error) setSettings(newSettings);
    return { error };
  };

  return { settings, loading, updateSettings };
}
"""
        with open("app/hooks/useAttendanceHistorySettings.ts", "w") as f: f.write(content)
        print("app/hooks/useAttendanceHistorySettings.ts: success")
    except Exception as e: report_fail("app/hooks/useAttendanceHistorySettings.ts", e)

    # File 11: useContributionHistorySettings.ts
    try:
        content = """import { useState, useEffect } from 'react';
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
    const { data: current } = await supabase.from("churches").select("settings").eq("id", churchId).single();
    const updated = { ...current?.settings, contributionHistory: newSettings };
    const { error } = await supabase.from("churches").update({ settings: updated }).eq("id", churchId);
    if (!error) setSettings(newSettings);
    return { error };
  };

  return { settings, loading, updateSettings };
}
"""
        with open("app/hooks/useContributionHistorySettings.ts", "w") as f: f.write(content)
        print("app/hooks/useContributionHistorySettings.ts: success")
    except Exception as e: report_fail("app/hooks/useContributionHistorySettings.ts", e)

    # File 12: useUserCalendarSettings.ts
    try:
        content = """import { useState, useEffect } from 'react';
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
"""
        with open("app/hooks/useUserCalendarSettings.ts", "w") as f: f.write(content)
        print("app/hooks/useUserCalendarSettings.ts: success")
    except Exception as e: report_fail("app/hooks/useUserCalendarSettings.ts", e)

    # File 13: useCurrentUser.ts
    try:
        content = """import { useState, useEffect } from "react";
import type { AppUser } from "@/app/lib/types";

export function useCurrentUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        console.error("Failed to fetch current user", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  return { user, loading };
}
"""
        with open("app/hooks/useCurrentUser.ts", "w") as f: f.write(content)
        print("app/hooks/useCurrentUser.ts: success")
    except Exception as e: report_fail("app/hooks/useCurrentUser.ts", e)

    # File 14: useUserManagement.ts
    try:
        content = """import { useState, useEffect } from 'react';
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
"""
        with open("app/hooks/useUserManagement.ts", "w") as f: f.write(content)
        print("app/hooks/useUserManagement.ts: success")
    except Exception as e: report_fail("app/hooks/useUserManagement.ts", e)

    # File 15: useServicePlan.ts
    try:
        content = """import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";

export function useServicePlan(churchId: string | undefined, planId: string | undefined) {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId || !planId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    async function fetchPlan() {
      const { data, error } = await supabase
        .from("service_plans")
        .select("*")
        .eq("id", planId)
        .eq("church_id", churchId)
        .single();

      if (!error) {
        setPlan(data);
      }
      setLoading(false);
    }

    fetchPlan();
  }, [churchId, planId]);

  return { plan, loading };
}
"""
        with open("app/hooks/useServicePlan.ts", "w") as f: f.write(content)
        print("app/hooks/useServicePlan.ts: success")
    except Exception as e: report_fail("app/hooks/useServicePlan.ts", e)

if __name__ == "__main__":
    process_files()
