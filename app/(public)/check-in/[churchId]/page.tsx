import SelfCheckIn from "./SelfCheckIn";
import type { Church } from "@/app/lib/types";
import { adminDb } from "@/app/lib/supabase/admin";

interface CheckInPageProps {
  params: Promise<{ church_id: string }>;
  searchParams: Promise<{ d?: string }>;
}

export default async function CheckInPage({ params, searchParams }: CheckInPageProps) {
  const { church_id } = await params;
  const { d: date } = await searchParams;

  // Fetch church on the server
  const { data: raw, error: churchError } = await adminDb
    .from("churches")
    .select("*")
    .eq("slug", church_id)
    .maybeSingle();

  if (churchError || !raw) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-200">
        Church not found.
      </div>
    );
  }

  const church: Church = {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    timezone: raw.timezone,
    logo_url: raw.logo_url ?? null,
    description: raw.description ?? null,
    status: raw.status ?? null,
    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
    enabledAt: raw.enabled_at ?? null,
    disabledAt: raw.disabled_at ?? null,
    address: raw.address ?? null,
    phone: raw.phone ?? null,
  };

  if (!date) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-200">
        Invalid check‑in link.
      </div>
    );
  }

  return (
    <SelfCheckIn
      church={church}
      date={date}
    />
  );
}
