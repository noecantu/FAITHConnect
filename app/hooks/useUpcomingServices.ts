'use client';

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import type { ServicePlan, ServicePlanFirestore } from "@/app/lib/types";

export function useUpcomingServices(churchId: string | null) {
  const [services, setServices] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    if (!churchId) {
      setServices([]);
      setLoading(false);
      return () => { isActive = false };
    }

    const load = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        const ref = collection(db, "churches", churchId, "servicePlans");
        const q = query(
          ref,
          where("dateString", ">=", today),
          orderBy("dateString", "asc")
        );

        const snap = await getDocs(q);

        if (!isActive) return;

        const items: ServicePlan[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as ServicePlanFirestore;

          const date = new Date(`${data.dateString}T${data.timeString}:00`);
          return {
            id: docSnap.id,
            ...data,
            date,
            dateTime: date,
          };
        });

        setServices(items);
      } catch (err) {
        if (isActive) {
          console.error("Error loading upcoming services:", err);
          setServices([]);
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    load();

    return () => {
      isActive = false;
    };
  }, [churchId]);

  return { services, loading };
}
