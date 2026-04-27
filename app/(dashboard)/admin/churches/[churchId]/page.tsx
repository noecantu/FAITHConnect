import MasterChurchDetailsClient from "./MasterChurchDetailsClient";
import { adminDb } from "@/app/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function MasterChurchDetailsPage({
  params,
}: {
  params: Promise<{ churchId: string }>;
}) {
  const { churchId: church_id } = await params;

  // 1. Load church document
  const { data: church, error: churchError } = await adminDb
    .from("churches")
    .select("*")
    .eq("id", church_id)
    .single();

  if (churchError || !church) {
    return <div className="p-6">Church not found.</div>;
  }

  // 2. Members count
  const { count: memberCount } = await adminDb
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("church_id", church_id)
    .neq("status", "Archived");

  // 3. Upcoming services
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: serviceCount } = await adminDb
    .from("service_plans")
    .select("id", { count: "exact", head: true })
    .eq("church_id", church_id)
    .gte("date_string", today.toISOString().slice(0, 10));

  // 4. Events this week
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const { count: eventCount } = await adminDb
    .from("events")
    .select("id", { count: "exact", head: true })
    .eq("church_id", church_id)
    .gte("date", startOfWeek.toISOString())
    .lte("date", endOfWeek.toISOString());

  // 5. Admins
  const { data: adminsData } = await adminDb
    .from("users")
    .select("*")
    .eq("church_id", church_id)
    .contains("roles", ["Admin"]);

  const admins = (adminsData ?? []).map((u) => ({ uid: u.id, ...u }));

  return (
    <MasterChurchDetailsClient
      church={church}
      memberCount={memberCount}
      serviceCount={serviceCount}
      eventCount={eventCount}
      admins={admins}
    />
  );
}
