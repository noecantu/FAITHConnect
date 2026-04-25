import os

files_content = {
    "app/lib/servicePlans.ts": """import { getSupabaseClient } from "@/app/lib/supabase/client";
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
""",
    "app/lib/events.ts": """import { getSupabaseClient } from "@/app/lib/supabase/client";

export async function createEvent(churchId: string, data: Record<string, unknown>) {
  if (!churchId) throw new Error("Missing churchId");

  const supabase = getSupabaseClient();
  const { data: row, error } = await supabase
    .from("events")
    .insert({
      church_id: churchId,
      title: data.title,
      date_string: data.dateString ?? data.date_string,
      description: data.description ?? null,
      notes: data.notes ?? null,
      visibility: data.visibility ?? "private",
      groups: data.groups ?? [],
    })
    .select()
    .single();

  if (error) throw error;
  return row;
}

export async function updateEvent(
  churchId: string,
  eventId: string,
  data: Record<string, unknown>
) {
  if (!churchId) throw new Error("Missing churchId");
  if (!eventId) throw new Error("Missing eventId");

  const supabase = getSupabaseClient();
  const updatePayload: Record<string, unknown> = {};

  if (data.title !== undefined) updatePayload.title = data.title;
  if (data.dateString !== undefined) updatePayload.date_string = data.dateString;
  if (data.date_string !== undefined) updatePayload.date_string = data.date_string;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.notes !== undefined) updatePayload.notes = data.notes;
  if (data.visibility !== undefined) updatePayload.visibility = data.visibility;
  if (data.groups !== undefined) updatePayload.groups = data.groups;

  const { error } = await supabase
    .from("events")
    .update(updatePayload)
    .eq("id", eventId)
    .eq("church_id", churchId);

  if (error) throw error;
}
""",
    "app/lib/contributions.ts": """import { getSupabaseClient } from "@/app/lib/supabase/client";
import type { Contribution } from "./types";

export function listenToContributions(
  churchId: string,
  callback: (contributions: Contribution[]) => void
): () => void {
  if (!churchId) return () => {};

  getSupabaseClient()
    .from("contributions")
    .select("*")
    .eq("church_id", churchId)
    .order("date", { ascending: false })
    .then(({ data }) => {
      if (!data) return;
      const contributions: Contribution[] = data.map((row) => ({
        id: row.id,
        memberId: row.member_id ?? undefined,
        memberName: row.member_name,
        amount: row.amount,
        category: row.category,
        contributionType: row.contribution_type,
        date: row.date,
        notes: row.notes ?? "",
      }));
      callback(contributions);
    });

  // Return a no-op unsubscribe (no real-time listener needed)
  return () => {};
}

export async function addContribution(
  churchId: string,
  data: Omit<Contribution, "id">
) {
  if (!churchId) throw new Error("Missing churchId");

  const supabase = getSupabaseClient();
  const payload: Record<string, unknown> = {
    church_id: churchId,
    member_name: data.memberName,
    amount: data.amount,
    category: data.category,
    contribution_type: data.contributionType,
    date: data.date,
    notes: data.notes ?? null,
  };

  if (data.memberId) payload.member_id = data.memberId;

  const { error } = await supabase.from("contributions").insert(payload);
  if (error) throw error;
}

export async function updateContribution(
  churchId: string,
  id: string,
  data: Partial<Omit<Contribution, "id">>
) {
  if (!churchId) throw new Error("Missing churchId");

  const supabase = getSupabaseClient();
  const updatePayload: Record<string, unknown> = {};

  if (data.memberId !== undefined) updatePayload.member_id = data.memberId;
  if (data.memberName !== undefined) updatePayload.member_name = data.memberName;
  if (data.amount !== undefined) updatePayload.amount = data.amount;
  if (data.category !== undefined) updatePayload.category = data.category;
  if (data.contributionType !== undefined) updatePayload.contribution_type = data.contributionType;
  if (data.date !== undefined) updatePayload.date = data.date;
  if (data.notes !== undefined) updatePayload.notes = data.notes;

  const { error } = await supabase
    .from("contributions")
    .update(updatePayload)
    .eq("id", id)
    .eq("church_id", churchId);

  if (error) throw error;
}

export async function deleteContribution(churchId: string, id: string) {
  if (!churchId) throw new Error("Missing churchId");

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("contributions")
    .delete()
    .eq("id", id)
    .eq("church_id", churchId);

  if (error) throw error;
}
"""
}

base_path = "/Users/noecantu/dev/FAITHConnect/"

for file_path, content in files_content.items():
    full_path = os.path.join(base_path, file_path)
    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w") as f:
            f.write(content)
        print(f"SUCCESS: {file_path}")
    except Exception as e:
        print(f"FAILURE: {file_path} - {str(e)}")
