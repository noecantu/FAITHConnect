import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";

export async function duplicateSetList(
  churchId: string,
  setListId: string,
  router: { push: (path: string) => void }
) {
  try {
    const originalRef = doc(db, "churches", churchId, "setlists", setListId);
    const originalSnap = await getDoc(originalRef);

    if (!originalSnap.exists()) return;

    const original = originalSnap.data();
    const sections = original.sections ?? [];

    const newSetListRef = doc(collection(db, "churches", churchId, "setlists"));
    const newSetListId = newSetListRef.id;

    await setDoc(newSetListRef, {
      churchId,
      title: `${original.title}_Copy`,
      dateString: original.dateString ?? null,
      timeString: original.timeString ?? null,
      serviceType: original.serviceType ?? null,
      serviceNotes: original.serviceNotes ?? "",
      createdBy: "system",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      sections,
    });

    router.push(`/church/${churchId}/music/setlists/${newSetListId}`);
  } catch (err) {
    console.error("Duplicate error:", err);
  }
}
