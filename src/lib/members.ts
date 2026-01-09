import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
  } from "firebase/firestore";
  import { db } from "@/lib/firebase";
  import type { Member } from "@/lib/types";
  
  export async function addMember(churchId: string, data: any) {
    const colRef = collection(db, "churches", churchId, "members");
    await addDoc(colRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  export async function updateMember(churchId: string, memberId: string, data: any) {
    const ref = doc(db, "churches", churchId, "members", memberId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }
  
  export async function deleteMember(churchId: string, memberId: string) {
    const ref = doc(db, "churches", churchId, "members", memberId);
    return await deleteDoc(ref);
  }
  
  export function listenToMembers(
    churchId: string,
    callback: (members: Member[]) => void
  ) {
    const q = query(
      collection(db, "churches", churchId, "members"),
      orderBy("lastName", "asc")
    );
  
    return onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map((doc) => {
        const raw = doc.data();
  
        return {
          id: doc.id,
          firstName: raw.firstName,
          lastName: raw.lastName,
          email: raw.email,
          phone: raw.phone,
          birthday: raw.birthday?.toDate?.() ?? null,
          status: raw.status,
          notes: raw.notes ?? "",
          photoUrl: raw.photoUrl ?? "",
          imageHint: raw.imageHint ?? "",
        };
      });
  
      callback(members);
    });
  }