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
  writeBatch,
  runTransaction
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Member, Relationship } from "@/lib/types";
import { removeUndefineds } from "@/lib/utils";

const RECIPROCAL_TYPES: Record<string, string> = {
  'Spouse': 'Spouse',
  'Parent': 'Child',
  'Child': 'Parent',
  'Sibling': 'Sibling',
  'Guardian': 'Ward',
  'Ward': 'Guardian',
};

function getReciprocalType(type: string): string {
  return RECIPROCAL_TYPES[type] || type;
}

export async function addMember(churchId: string, data: Partial<Omit<Member, 'id'>> & { id: string }) {
  await runTransaction(db, async (transaction) => {
    const relationships = data.relationships || [];
    
    // 1. Identify and Read all related members FIRST
    const relatedIds = relationships.map(r => r.memberIds[1]).filter(Boolean);
    const relatedRefs = relatedIds.map(id => doc(db, "churches", churchId, "members", id));
    
    // Use Promise.all to read in parallel
    const relatedDocs = await Promise.all(relatedRefs.map(ref => transaction.get(ref)));
    
    // 2. Prepare writes for related members
    relatedDocs.forEach((relDoc, index) => {
      if (relDoc.exists()) {
        const relId = relatedIds[index];
        const relData = relDoc.data() as Member;
        const newRelInfo = relationships.find(r => r.memberIds[1] === relId);
        
        if (newRelInfo) {
          const existingRels = relData.relationships || [];
          
          // Avoid duplicates if for some reason it already exists
          if (!existingRels.some(r => r.memberIds[1] === data.id)) {
            const reciprocalRel: Relationship = {
              memberIds: [relId, data.id],
              type: getReciprocalType(newRelInfo.type),
            };
            if (newRelInfo.anniversary) {
              reciprocalRel.anniversary = newRelInfo.anniversary;
            }

            transaction.update(relatedRefs[index], {
              relationships: [...existingRels, reciprocalRel],
              updatedAt: serverTimestamp()
            });
          }
        }
      }
    });

    // 3. Set the new member document
    const memberRef = doc(db, "churches", churchId, "members", data.id);
    const payload: any = { ...data };
    
    if (data.birthday) payload.birthday = Timestamp.fromDate(new Date(data.birthday));
    if (data.baptismDate) payload.baptismDate = Timestamp.fromDate(new Date(data.baptismDate));
    if (data.anniversary) payload.anniversary = Timestamp.fromDate(new Date(data.anniversary));
    
    payload.createdAt = serverTimestamp();
    payload.updatedAt = serverTimestamp();

    delete payload.id;

    transaction.set(memberRef, removeUndefineds(payload));
  });
}

export async function updateMember(churchId: string, memberId: string, data: Partial<Omit<Member, 'id'>>) {
  await runTransaction(db, async (transaction) => {
    const memberRef = doc(db, "churches", churchId, "members", memberId);
    
    // 1. Read the member to be updated
    const memberDoc = await transaction.get(memberRef);
    if (!memberDoc.exists()) {
      throw new Error("Member does not exist");
    }
    
    const currentMember = memberDoc.data() as Member;
    const oldRels = currentMember.relationships || [];
    const newRels = data.relationships;

    // If relationships are not being updated, just update the member and exit
    if (!newRels) {
        const payload: any = { ...data };
        if (data.birthday) payload.birthday = Timestamp.fromDate(new Date(data.birthday));
        if (data.baptismDate) payload.baptismDate = Timestamp.fromDate(new Date(data.baptismDate));
        if (data.anniversary) payload.anniversary = Timestamp.fromDate(new Date(data.anniversary));
        payload.updatedAt = serverTimestamp();
        transaction.update(memberRef, removeUndefineds(payload));
        return;
    }

    // 2. Identify all related members that need to be read (union of old and new)
    const oldIds = oldRels.map(r => r.memberIds[1]);
    const newIds = newRels.map(r => r.memberIds[1]);
    const allRelatedIds = Array.from(new Set([...oldIds, ...newIds])).filter(Boolean);

    // 3. Read all related members
    const relatedRefs = allRelatedIds.map(id => doc(db, "churches", churchId, "members", id));
    const relatedDocs = await Promise.all(relatedRefs.map(ref => transaction.get(ref)));
    
    const relatedDocsMap = new Map();
    relatedDocs.forEach((d, i) => {
        if (d.exists()) relatedDocsMap.set(allRelatedIds[i], d);
    });

    // 4. Update related members
    allRelatedIds.forEach((relatedId, index) => {
        const relatedDoc = relatedDocsMap.get(relatedId);
        if (!relatedDoc) return; // Should not happen if data integrity is good, but safe to skip

        const relatedData = relatedDoc.data() as Member;
        let relatedRels = relatedData.relationships || [];
        const relatedRef = relatedRefs[index];

        const oldRel = oldRels.find(r => r.memberIds[1] === relatedId);
        const newRel = newRels.find(r => r.memberIds[1] === relatedId);

        let changed = false;

        if (newRel && !oldRel) {
            // New relationship added -> Add reciprocal
            const reciprocal: Relationship = {
                memberIds: [relatedId, memberId],
                type: getReciprocalType(newRel.type),
            };
            if (newRel.anniversary) {
              reciprocal.anniversary = newRel.anniversary;
            }
            relatedRels.push(reciprocal);
            changed = true;
        } else if (!newRel && oldRel) {
            // Relationship removed -> Remove reciprocal
            const initialLength = relatedRels.length;
            relatedRels = relatedRels.filter(r => r.memberIds[1] !== memberId);
            if (relatedRels.length !== initialLength) changed = true;
        } else if (newRel && oldRel) {
            // Relationship modified?
            if (newRel.type !== oldRel.type || newRel.anniversary !== oldRel.anniversary) {
                const newReciprocalType = getReciprocalType(newRel.type);
                relatedRels = relatedRels.map(r => {
                    if (r.memberIds[1] === memberId) {
                        const updatedRel: Relationship = { 
                          ...r, 
                          type: newReciprocalType
                        };
                        if (newRel.anniversary) {
                          updatedRel.anniversary = newRel.anniversary;
                        } else {
                          delete updatedRel.anniversary;
                        }
                        return updatedRel;
                    }
                    return r;
                });
                changed = true;
            }
        }

        if (changed) {
            transaction.update(relatedRef, { 
                relationships: relatedRels,
                updatedAt: serverTimestamp() 
            });
        }
    });

    // 5. Update the main member
    const payload: any = { ...data };
    if (data.birthday) payload.birthday = Timestamp.fromDate(new Date(data.birthday));
    if (data.baptismDate) payload.baptismDate = Timestamp.fromDate(new Date(data.baptismDate));
    if (data.anniversary) payload.anniversary = Timestamp.fromDate(new Date(data.anniversary));
    payload.updatedAt = serverTimestamp();
    
    transaction.update(memberRef, removeUndefineds(payload));
  });
}

export async function deleteMember(churchId: string, memberId: string) {
  await runTransaction(db, async (transaction) => {
    const memberRef = doc(db, "churches", churchId, "members", memberId);
    
    // 1. Read the member to be deleted
    const memberDoc = await transaction.get(memberRef);
    if (!memberDoc.exists()) return;

    const memberData = memberDoc.data() as Member;
    const relationships = memberData.relationships || [];
    
    // 2. Read all related members
    const relatedIds = relationships.map(r => r.memberIds[1]).filter(Boolean);
    const relatedRefs = relatedIds.map(id => doc(db, "churches", churchId, "members", id));
    const relatedDocs = await Promise.all(relatedRefs.map(ref => transaction.get(ref)));

    // 3. Update related members (remove relationships)
    relatedDocs.forEach((relDoc, index) => {
        if (relDoc.exists()) {
            const relData = relDoc.data() as Member;
            const existingRels = relData.relationships || [];
            const newRels = existingRels.filter(r => r.memberIds[1] !== memberId);
            
            if (newRels.length !== existingRels.length) {
                transaction.update(relatedRefs[index], {
                    relationships: newRels,
                    updatedAt: serverTimestamp()
                });
            }
        }
    });

    // 4. Delete the member
    transaction.delete(memberRef);
  });
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
        baptismDate: raw.baptismDate?.toDate?.()?.toISOString().split('T')[0] ?? undefined,
        familyId: raw.familyId,
        notes: raw.notes ?? "",
        relationships: raw.relationships,
        anniversary: raw.anniversary?.toDate?.()?.toISOString().split('T')[0] ?? undefined,
        roles: raw.roles,
      };
    });
    
    callback(members);
  });
}
