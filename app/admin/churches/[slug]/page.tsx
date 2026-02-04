"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/app/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";

export default function ChurchDashboardPage() {
  const { slug } = useParams();

  const [church, setChurch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [memberCount, setMemberCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    async function load() {
      if (!slug) return;

      setLoading(true);

      // 1. Load church document
      const churchRef = doc(db, "churches", slug as string);
      const churchSnap = await getDoc(churchRef);

      if (churchSnap.exists()) {
        setChurch(churchSnap.data());
      }

      // 2. Members count
      const membersRef = collection(db, "churches", slug as string, "members");
      const membersSnap = await getCountFromServer(membersRef);
      setMemberCount(membersSnap.data().count);

      // 3. Upcoming services (today + future)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const servicesRef = collection(
        db,
        "churches",
        slug as string,
        "servicePlans"
      );
      const servicesQuery = query(
        servicesRef,
        where("date", ">=", today.toISOString())
      );
      const servicesSnap = await getCountFromServer(servicesQuery);
      setServiceCount(servicesSnap.data().count);

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

      const eventsRef = collection(
        db,
        "churches",
        slug as string,
        "events"
      );
      const eventsQuery = query(
        eventsRef,
        where("date", ">=", startOfWeek.toISOString()),
        where("date", "<=", endOfWeek.toISOString())
      );
      const eventsSnap = await getCountFromServer(eventsQuery);
      setEventCount(eventsSnap.data().count);

      setLoading(false);
    }

    load();
  }, [slug]);

  if (loading || !church) {
    return (
      <div className="p-6">
        <p>Loading church dashboard…</p>
      </div>
    );
  }

  // Logo → initials → fallback
  const initials = church.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-6 space-y-6">

      {/* Identity Card */}
      <div className="border rounded-lg p-6 flex items-center gap-6 bg-white shadow-sm">
        {church.logoUrl ? (
          <img
            src={church.logoUrl}
            alt="Church Logo"
            className="w-20 h-20 rounded-lg object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
        )}

        <div>
          <h1 className="text-2xl font-bold">{church.name}</h1>
          <p className="text-gray-600">{church.timezone}</p>
        </div>
      </div>

      {/* Two-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Stats Card */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Church Stats</h2>

          <div className="space-y-2">
            <p><strong>Members:</strong> {memberCount}</p>
            <p><strong>Upcoming Services:</strong> {serviceCount}</p>
            <p><strong>Events This Week:</strong> {eventCount}</p>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>

          <div className="space-y-3">
            <button className="w-full bg-black text-white py-2 rounded">
              Add Member
            </button>
            <button className="w-full bg-black text-white py-2 rounded">
              Add Event
            </button>
            <button className="w-full bg-black text-white py-2 rounded">
              Add Service Plan
            </button>
            <button className="w-full bg-gray-200 py-2 rounded">
              Manage Settings
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
