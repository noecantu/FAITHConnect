import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Contribution, ContributionRecord } from "@/lib/types";

// ------------------------------
// Real-time listener
// ------------------------------
export function listenToContributions(
  churchId: string,
  callback: (contributions: Contribution[]) => void
) {
  const q = query(
    collection(db, "churches", churchId, "contributions"),
    orderBy("date", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const data: Contribution[] = snapshot.docs.map((docSnap) => {
      const raw = docSnap.data() as ContributionRecord;

      return {
        id: docSnap.id,
        memberId: raw.memberId,
        memberName: raw.memberName,
        amount: raw.amount,
        category: raw.category as Contribution["category"],
        contributionType: raw.contributionType as Contribution["contributionType"],
        date: raw.date?.toDate?.() ?? new Date(),
        notes: raw.notes,
      };
    });

    callback(data);
  });
}

// ------------------------------
// Add
// ------------------------------
export async function addContribution(
  churchId: string,
  data: Omit<Contribution, "id" | "date"> & { date: Date }
) {
  const colRef = collection(db, "churches", churchId, "contributions");
  await addDoc(colRef, {
    memberId: data.memberId,
    memberName: data.memberName,
    amount: data.amount,
    category: data.category,
    contributionType: data.contributionType,
    date: data.date,
    notes: data.notes ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

// ------------------------------
// Update
// ------------------------------
export async function updateContribution(
  churchId: string,
  id: string,
  data: Partial<Omit<Contribution, "id" | "date">> & { date?: Date }
) {
  const ref = doc(db, "churches", churchId, "contributions", id);
  await updateDoc(ref, {
    ...data,
    ...(data.date ? { date: data.date } : {}),
    updatedAt: serverTimestamp(),
  });
}

// ------------------------------
// Delete
// ------------------------------
export async function deleteContribution(churchId: string, id: string) {
  const ref = doc(db, "churches", churchId, "contributions", id);
  await deleteDoc(ref);
}