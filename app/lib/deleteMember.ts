"use client";

import { db, storage } from "@/app/lib/firebase/client";
import { doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";

export async function deleteMember(
  churchId: string,
  memberId: string,
  router: any,
  toast: any
) {
  try {
    // 1. Delete Firestore document
    await deleteDoc(doc(db, "churches", churchId, "members", memberId));

    // 2. Delete Storage files (photo + QR)
    const photoRef = ref(
      storage,
      `churches/${churchId}/members/${memberId}/photo.jpg`
    );

    const qrRef = ref(
      storage,
      `churches/${churchId}/members/${memberId}/qr.png`
    );

    // Use Promise.allSettled so missing files don't break the flow
    await Promise.allSettled([
      deleteObject(photoRef),
      deleteObject(qrRef),
    ]);

    // 3. Toast + redirect
    toast({
      title: "Member deleted",
      description: "The member has been removed.",
    });

    router.push(`/church/${churchId}/members`);
  } catch (error) {
    console.error("Error deleting member:", error);

    toast({
      title: "Error",
      description: "Failed to delete member.",
      variant: "destructive",
    });
  }
}
