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

        // 🔥 FIX: Firestore now stores date as a string, not Timestamp
        date: raw.date instanceof Timestamp
        ? raw.date.toDate().toISOString().substring(0, 10)
        : (raw.date ?? ""),      

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
  data: Omit<Contribution, "id"> // 🔥 FIX: date is already a string in Contribution
) {
  const colRef = collection(db, "churches", churchId, "contributions");
  await addDoc(colRef, {
    memberId: data.memberId,
    memberName: data.memberName,
    amount: data.amount,
    category: data.category,
    contributionType: data.contributionType,

    // 🔥 FIX: store string directly
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
  data: Partial<Omit<Contribution, "id">> // 🔥 FIX: date is string, not Date
) {
  const ref = doc(db, "churches", churchId, "contributions", id);
  await updateDoc(ref, {
    ...data,
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
