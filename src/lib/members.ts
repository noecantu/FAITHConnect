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
    Timestamp,
  } from "firebase/firestore";
  import { db } from "@/lib/firebase";
  import type { Member } from "@/lib/types";
  
  export async function addMember(churchId: string, data: Partial<Omit<Member, 'id'>>) {
    const colRef = collection(db, "churches", churchId, "members");

    const payload: any = { ...data };
    if (data.birthday) payload.birthday = Timestamp.fromDate(new Date(data.birthday));
    if (data.anniversary) payload.anniversary = Timestamp.fromDate(new Date(data.anniversary));

    await addDoc(colRef, {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  
  export async function updateMember(churchId: string, memberId: string, data: Partial<Omit<Member, 'id'>>) {
    const ref = doc(db, "churches", churchId, "members", memberId);
    
    const payload: any = { ...data };
    if (data.birthday) payload.birthday = Timestamp.fromDate(new Date(data.birthday));
    if (data.anniversary) payload.anniversary = Timestamp.fromDate(new Date(data.anniversary));

    await updateDoc(ref, {
      ...payload,
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
      const members: Member[] = snapshot.docs.map((doc) => {
        const raw = doc.data();
  
        return {
          id: doc.id,
          firstName: raw.firstName,
          lastName: raw.lastName,
          email: raw.email,
          phoneNumber: raw.phoneNumber,
          profilePhotoUrl: raw.profilePhotoUrl ?? "",
          status: raw.status,
          address: raw.address,
          birthday: raw.birthday?.toDate?.()?.toISOString().split('T')[0] ?? undefined,
          familyId: raw.familyId,
          notes: raw.notes ?? "",
          relationships: raw.relationships,
          anniversary: raw.anniversary?.toDate?.()?.toISOString().split('T')[0] ?? undefined,
        };
      });
  
      callback(members);
    });
  }
