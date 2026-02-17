import { db } from "@/app/lib/firebase";
import { query, collection, where, getDocs } from "firebase/firestore";
import SelfCheckIn from "./SelfCheckIn";
import type { Church } from "@/app/lib/types";
import type { DocumentData } from "firebase/firestore";

interface CheckInPageProps {
  params: Promise<{ churchId: string }>;
  searchParams: Promise<{ t?: string; d?: string }>;
}

export default async function CheckInPage({ params, searchParams }: CheckInPageProps) {
  const { churchId } = await params;
  const { t: token, d: date } = await searchParams;

  // Fetch church on the server
  const q = query(
    collection(db, "churches"),
    where("slug", "==", churchId)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-200">
        Church not found.
      </div>
    );
  }

  const raw: DocumentData = snapshot.docs[0].data();

  const church: Church = {
    id: snapshot.docs[0].id,
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

  if (!token || !date) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-200">
        Invalid check‑in link.
      </div>
    );
  }

  return (
    <SelfCheckIn
      church={church}
      token={token}
      date={date}
    />
  );
}
