import SelfCheckIn from "./SelfCheckIn";
import type { Church } from "@/app/lib/types";
import { adminDb } from "@/app/lib/firebase/admin";

interface CheckInPageProps {
  params: Promise<{ churchId: string }>;
  searchParams: Promise<{ d?: string }>;
}

export default async function CheckInPage({ params, searchParams }: CheckInPageProps) {
  const { churchId } = await params;
  const { d: date } = await searchParams;

  // Fetch church on the server using Admin SDK (ignores Firestore rules)
  const churchSnap = await adminDb
    .collection("churches")
    .where("slug", "==", churchId)
    .get();

  if (churchSnap.empty) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-200">
        Church not found.
      </div>
    );
  }

  const raw = churchSnap.docs[0].data();

  const church: Church = {
    id: churchSnap.docs[0].id,
    name: raw.name,
    slug: raw.slug,
    timezone: raw.timezone,
    logoUrl: raw.logoUrl ?? null,
    description: raw.description ?? null,
    status: raw.status ?? null,
    createdAt: raw.createdAt?.toDate?.().toISOString() ?? null,
    updatedAt: raw.updatedAt?.toDate?.().toISOString() ?? null,
    enabledAt: raw.enabledAt ?? null,
    disabledAt: raw.disabledAt ?? null,
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
