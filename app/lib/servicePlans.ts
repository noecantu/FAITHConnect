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
  const isPublic = (row.is_public as boolean) ?? false;

  return {
    id: row.id as string,
    title: row.title as string,
    dateString,
    timeString,
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
    notes: string;
    sections: ServicePlanSection[];
    createdBy: string;
  }
): Promise<ServicePlan> {
  const supabase = getSupabaseClient();
  const now = Date.now();

  const { data: row, error } = await supabase
    .from("service_plans")
    .insert({
      church_id: churchId,
      title: data.title,
      date_string: data.dateString,
      time_string: data.timeString,
      notes: data.notes,
      sections: data.sections,
      is_public: false,
      groups: [],
      created_by: data.createdBy,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  if (error || !row) throw error ?? new Error("Failed to create service plan");
  return rowToServicePlan(row);
}

export async function updateServicePlan(
  churchId: string,
  id: string,
  data: Partial<{
    title: string;
    dateString: string;
    timeString: string;
    notes: string;
    sections: ServicePlanSection[];
  }>
): Promise<void> {
  const supabase = getSupabaseClient();
  const updatePayload: Record<string, unknown> = { updated_at: Date.now() };

  if (data.title !== undefined) updatePayload.title = data.title;
  if (data.dateString !== undefined) updatePayload.date_string = data.dateString;
  if (data.timeString !== undefined) updatePayload.time_string = data.timeString;
  if (data.notes !== undefined) updatePayload.notes = data.notes;
  if (data.sections !== undefined) updatePayload.sections = data.sections;

  const { error } = await supabase
    .from("service_plans")
    .update(updatePayload)
    .eq("id", id)
    .eq("church_id", churchId);

  if (error) throw error;
}

export async function deleteServicePlan(churchId: string, id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("service_plans")
    .delete()
    .eq("id", id)
    .eq("church_id", churchId);

  if (error) throw error;
}

export async function duplicateServicePlan(
  churchId: string,
  plan: ServicePlan
): Promise<ServicePlan> {
  const copiedSections = plan.sections.map((s) => ({
    id: crypto.randomUUID(),
    title: s.title,
    personId: s.personId,
    songIds: [...s.songIds],
    notes: s.notes,
    color: s.color,
  }));

  return createServicePlan(churchId, {
    title: `${plan.title} (Copy)`,
    dateString: plan.dateString,
    timeString: plan.timeString,
    notes: plan.notes,
    sections: copiedSections,
    createdBy: plan.createdBy,
  });
}
