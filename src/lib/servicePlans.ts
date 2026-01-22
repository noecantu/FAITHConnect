import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
  } from 'firebase/firestore';
  import { db } from './firebase';
  import type { ServicePlan } from './types';
  
  const servicePlansCollection = (churchId: string) =>
    collection(db, 'churches', churchId, 'servicePlans');
  
  export async function getServicePlans(churchId: string): Promise<ServicePlan[]> {
    const q = query(servicePlansCollection(churchId), orderBy('date', 'desc'));
    const snap = await getDocs(q);
  
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ServicePlan, 'id'>),
    }));
  }
  
  export async function getServicePlanById(
    churchId: string,
    id: string
  ): Promise<ServicePlan | null> {
    const ref = doc(servicePlansCollection(churchId), id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
  
    return {
      id: snap.id,
      ...(snap.data() as Omit<ServicePlan, 'id'>),
    };
  }
  
  export async function createServicePlan(
    churchId: string,
    data: Omit<ServicePlan, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ServicePlan> {
    const ref = await addDoc(servicePlansCollection(churchId), {
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  
    return {
      id: ref.id,
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  export async function updateServicePlan(
    churchId: string,
    id: string,
    data: Partial<Omit<ServicePlan, 'id' | 'createdAt'>>
  ): Promise<void> {
    const ref = doc(servicePlansCollection(churchId), id);
    await updateDoc(ref, {
      ...data,
      updatedAt: Date.now(),
    });
  }
  
  export async function deleteServicePlan(churchId: string, id: string): Promise<void> {
    const ref = doc(servicePlansCollection(churchId), id);
    await deleteDoc(ref);
  }
  