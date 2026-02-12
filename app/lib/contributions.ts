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
import { db } from "./firebase";
import type { Contribution, ContributionRecord } from "./types";

// ------------------------------
// Real-time listener
// ------------------------------
export function listenToContributions(
churchId: string, callback: (contributions: Contribution[]) => void) {
  if (!churchId) return () => {};

  const q = query(
    collection(db, "churches", churchId, "contributions"),
    orderBy("date", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const data: Contribution[] = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as ContributionRecord;

        let dateString = "";
        if (raw.date instanceof Timestamp) {
          dateString = raw.date.toDate().toISOString().slice(0, 10);
        } else if (typeof raw.date === "string") {
          dateString = raw.date;
        }

        return {
          id: docSnap.id,
          memberId: raw.memberId,
          memberName: raw.memberName,
          amount: raw.amount,
          category: raw.category,
          contributionType: raw.contributionType,
          date: dateString,
          notes: raw.notes ?? "",
        };
      });

      callback(data);
    },
    (error) => {
      if (error.code !== "permission-denied") {
        console.error("listenToContributions error:", error);
      }
    }
  );
}

// ------------------------------
// Add
// ------------------------------
export async function addContribution(
  churchId: string,
  data: Omit<Contribution, "id">
) {
  if (!churchId) throw new Error("Missing churchId");

  const colRef = collection(db, "churches", churchId, "contributions");

  const payload: any = {
    memberName: data.memberName,
    amount: data.amount,
    category: data.category,
    contributionType: data.contributionType,
    date: data.date,
    notes: data.notes ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Only include memberId if it is defined
  if (data.memberId) {
    payload.memberId = data.memberId;
  }

  await addDoc(colRef, payload);
}

// ------------------------------
// Update
// ------------------------------
export async function updateContribution(
  churchId: string,
  id: string,
  data: Partial<Omit<Contribution, "id">>
) {
  if (!churchId) throw new Error("Missing churchId");

  const ref = doc(db, "churches", churchId, "contributions", id);

  const updatePayload: Record<string, unknown> = {
    updatedAt: serverTimestamp(),
  };

  if (data.memberId !== undefined) updatePayload.memberId = data.memberId;
  if (data.memberName !== undefined) updatePayload.memberName = data.memberName;
  if (data.amount !== undefined) updatePayload.amount = data.amount;
  if (data.category !== undefined) updatePayload.category = data.category;
  if (data.contributionType !== undefined)
    updatePayload.contributionType = data.contributionType;
  if (data.date !== undefined) updatePayload.date = data.date;
  if (data.notes !== undefined) updatePayload.notes = data.notes;

  await updateDoc(ref, updatePayload);
}

// ------------------------------
// Delete
// ------------------------------
export async function deleteContribution(churchId: string, id: string) {
  if (!churchId) throw new Error("Missing churchId");

  const ref = doc(db, "churches", churchId, "contributions", id);
  await deleteDoc(ref);
}
