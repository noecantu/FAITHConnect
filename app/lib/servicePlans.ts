import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { ServicePlan, ServicePlanSection } from "./types";

function toDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00`);
}

function toDateTime(dateString: string, timeString: string): Date {
  return new Date(`${dateString}T${timeString}:00`);
}

function rowToServicePlan(row: Record<string, unknown>): ServicePlan {
  const dateString = row.date_string as string;
  const timeString = row.time_string as string;
  const isPublic = row.is_public === true;

  return {
    id: row.id as string,
    title: row.title as string,
    dateString,
    timeString,
    theme: (row.theme as string | null) ?? null,
    scripture: (row.scripture as string | null) ?? null,
    scriptureText: (row.scripture_text as string | null) ?? null,
    scriptureTranslation: (row.scripture_translation as string | null) ?? null,
    notes: (row.notes as string) ?? "",
    isPublic,
    groups: (row.groups as string[]) ?? [],
    sections: (row.sections as ServicePlanSection[]) ?? [],
    createdBy: row.created_by as string,
    createdAt: row.created_at as number,
    updatedAt: row.updated_at as number,
    date: toDate(dateString),
    dateTime: toDateTime(dateString, timeString),
    visibility: isPublic ? "public" : "private",
  };
}

export async function getServicePlans(churchId: string): Promise<ServicePlan[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("service_plans")
    .select("*")
    .eq("church_id", churchId)
    .order("date_string", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToServicePlan);
}

export async function getServicePlanById(
  churchId: string,
  id: string
): Promise<ServicePlan | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("service_plans")
    .select("*")
    .eq("church_id", churchId)
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return rowToServicePlan(data);
}

export async function createServicePlan(
  churchId: string,
  data: {
    title: string;
    dateString: string;
    timeString: string;
    theme?: string | null;
    scripture?: string | null;
    scriptureText?: string | null;
    scriptureTranslation?: string | null;
    notes: string;
    isPublic: boolean;
    groups: string[];
    sections: ServicePlanSection[];
    createdBy?: string;
  }
): Promise<ServicePlan> {
  const res = await fetch("/api/service-plans/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      churchId,
      title: data.title,
      dateString: data.dateString,
      timeString: data.timeString,
      theme: data.theme,
      scripture: data.scripture,
      scriptureText: data.scriptureText,
      scriptureTranslation: data.scriptureTranslation,
      notes: data.notes,
      isPublic: data.isPublic,
      groups: data.groups,
      sections: data.sections,
      createdBy: data.createdBy,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : `Failed to create service plan (${res.status})`
    );
  }

  return rowToServicePlan(body.row as Record<string, unknown>);
}

export async function updateServicePlan(
  churchId: string,
  id: string,
  data: Partial<{
    title: string;
    dateString: string;
    timeString: string;
    theme: string;
    scripture: string;
    scriptureText: string;
    scriptureTranslation: string;
    notes: string;
    isPublic: boolean;
    groups: string[];
    sections: ServicePlanSection[];
  }>
): Promise<void> {
  const res = await fetch("/api/service-plans/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      churchId,
      planId: id,
      ...data,
    }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : `Failed to update service plan (${res.status})`
    );
  }
}

export async function deleteServicePlan(churchId: string, id: string): Promise<void> {
  const res = await fetch("/api/service-plans/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ churchId, planId: id }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : `Failed to delete service plan (${res.status})`
    );
  }
}

export async function duplicateServicePlan(
  churchId: string,
  plan: ServicePlan
): Promise<ServicePlan> {
  const copiedSections = plan.sections.map((s) => ({
    id: crypto.randomUUID(),
    title: s.title,
    personId: s.personId,
    personName: s.personName ?? null,
    startTime: s.startTime ?? null,
    durationMinutes: s.durationMinutes ?? null,
    songIds: [...s.songIds],
    notes: s.notes,
    color: s.color,
  }));

  return createServicePlan(churchId, {
    title: `${plan.title} (Copy)`,
    dateString: plan.dateString,
    timeString: plan.timeString,
    theme: plan.theme ?? null,
    scripture: plan.scripture ?? null,
    scriptureText: plan.scriptureText ?? null,
    scriptureTranslation: plan.scriptureTranslation ?? null,
    notes: plan.notes,
    isPublic: plan.isPublic,
    groups: plan.groups,
    sections: copiedSections,
    createdBy: plan.createdBy,
  });
}
