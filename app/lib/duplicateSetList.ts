import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import type { User } from "@/app/lib/types";

export async function duplicateSetList(
  churchId: string,
  setListId: string,
  router: any,
  toast: any,
  currentUser: User | null
) {
  try {
    const originalRef = doc(db, "churches", churchId, "setlists", setListId);
    const originalSnap = await getDoc(originalRef);

    if (!originalSnap.exists()) return;

    const original = originalSnap.data();

    // NEW: sections are stored directly in the document
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
      createdBy: currentUser?.id ?? "system",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),

      // NEW: copy sections array directly
      sections,
    });

    toast({ title: "Set list duplicated" });
    router.push(`/music/setlists/${newSetListId}`);
  } catch (err) {
    console.error("Duplicate error:", err);
    toast({ title: "Could not duplicate" });
  }
}
