'use client';

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import type { ServicePlan, ServicePlanFirestore, UserProfile } from "@/app/lib/types";
import { canUserSeeEvent } from "@/app/lib/canUserSeeEvent";

export function useUpcomingServices(churchId: string | null, user: UserProfile | null) {
  const [services, setServices] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    if (!churchId || !user) {
      setServices([]);
      setLoading(false);
      return () => { isActive = false };
    }

    const safeChurchId: string = churchId;
    const safeUser = user;

    const load = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);

        const ref = collection(db, "churches", safeChurchId, "servicePlans");
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

        // ⭐ Step 5: canonical visibility engine
        const visible = items.filter((service) =>
          canUserSeeEvent(safeUser, {
            visibility: service.isPublic ? "public" : "private",
            groups: service.groups ?? [],
          })
        );

        setServices(visible);
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
  }, [churchId, user]);

  return { services, loading };
}
