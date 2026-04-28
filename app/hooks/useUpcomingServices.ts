import { useState, useEffect } from 'react';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { fromDateString, toDateTime } from "@/app/lib/date-utils";
import type { ServicePlan, ServicePlanSection } from "@/app/lib/types";

type ServicePlanRow = {
  id: string;
  title: string;
  date_string: string;
  time_string: string;
  notes?: string | null;
  is_public?: boolean | null;
  groups?: string[] | null;
  sections?: ServicePlanSection[] | null;
  created_by?: string | null;
  created_at?: number | string | null;
  updated_at?: number | string | null;
};

function isValidDate(value: Date) {
  return Number.isFinite(value.getTime());
}

export function useUpcomingServices(churchId: string | null | undefined) {
  const [services, setServices] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!churchId) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    async function fetchServices() {
      const { data, error } = await supabase
        .from("service_plans")
        .select("*")
        .eq("church_id", churchId)
        .gte("date_string", today)
        .order("date_string", { ascending: true });

      if (!error) {
        const mapped: ServicePlan[] = ((data ?? []) as ServicePlanRow[])
          .map((row) => {
            const dateString = typeof row.date_string === "string" ? row.date_string : "";
            const timeString = typeof row.time_string === "string" && row.time_string.trim().length > 0
              ? row.time_string
              : "00:00";

            const date = fromDateString(dateString);
            const dateTime = toDateTime(dateString, timeString);

            return {
              id: row.id,
              title: row.title,
              dateString,
              timeString,
              notes: row.notes ?? "",
              isPublic: Boolean(row.is_public),
              groups: Array.isArray(row.groups) ? row.groups : [],
              sections: Array.isArray(row.sections) ? row.sections : [],
              createdBy: row.created_by ?? "",
              createdAt: Number(row.created_at ?? Date.now()),
              updatedAt: Number(row.updated_at ?? Date.now()),
              date,
              dateTime,
              visibility: (row.is_public ? "public" : "private") as "public" | "private",
            };
          })
          .filter((service) => service.dateString.length > 0 && isValidDate(service.date) && isValidDate(service.dateTime));

        setServices(mapped);
      }
      setLoading(false);
    }

    fetchServices();
  }, [churchId]);

  return { services, loading };
}
