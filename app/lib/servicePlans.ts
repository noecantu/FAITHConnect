import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';

import { db } from './firebase';
import type { ServicePlan, ServicePlanFirestore, ServicePlanSection } from './types';

// -----------------------------------------------------
// Collection reference
// -----------------------------------------------------
const servicePlansCollection = (churchId: string) =>
  collection(db, 'churches', churchId, 'servicePlans');

// -----------------------------------------------------
// Helpers for derived fields
// -----------------------------------------------------
function toDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00`);
}

function toDateTime(dateString: string, timeString: string): Date {
  return new Date(`${dateString}T${timeString}:00`);
}

// -----------------------------------------------------
// Get all service plans
// -----------------------------------------------------
export async function getServicePlans(churchId: string): Promise<ServicePlan[]> {
  const q = query(servicePlansCollection(churchId), orderBy('dateString', 'desc'));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data() as ServicePlanFirestore;

    return {
      id: d.id,
      title: data.title,

      dateString: data.dateString,
      timeString: data.timeString,

      date: toDate(data.dateString),
      dateTime: toDateTime(data.dateString, data.timeString),

      notes: data.notes ?? '',
      sections: data.sections ?? [],

      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as ServicePlan;
  });
}

// -----------------------------------------------------
// Get single service plan
// -----------------------------------------------------
export async function getServicePlanById(
  churchId: string,
  id: string
): Promise<ServicePlan | null> {
  const ref = doc(servicePlansCollection(churchId), id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;

  const data = snap.data() as ServicePlanFirestore;

  return {
    id: snap.id,
    title: data.title,

    dateString: data.dateString,
    timeString: data.timeString,

    date: toDate(data.dateString),
    dateTime: toDateTime(data.dateString, data.timeString),

    notes: data.notes ?? '',
    sections: data.sections ?? [],

    createdBy: data.createdBy,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

// -----------------------------------------------------
// Create service plan
// -----------------------------------------------------
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
  const now = Date.now();

  const payload = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await addDoc(servicePlansCollection(churchId), payload);

  return {
    id: ref.id,
    ...payload,
    date: toDate(payload.dateString),
    dateTime: toDateTime(payload.dateString, payload.timeString),
  };
}

// -----------------------------------------------------
// Update service plan
// -----------------------------------------------------
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
  const ref = doc(servicePlansCollection(churchId), id);

  await updateDoc(ref, {
    ...data,
    updatedAt: Date.now(),
  });
}

// -----------------------------------------------------
// Delete service plan
// -----------------------------------------------------
export async function deleteServicePlan(churchId: string, id: string): Promise<void> {
  const ref = doc(servicePlansCollection(churchId), id);
  await deleteDoc(ref);
}
