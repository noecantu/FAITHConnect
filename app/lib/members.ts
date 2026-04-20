import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import type { Member, Relationship } from "@/app/lib/types";
import { removeUndefineds } from "@/app/lib/utils";

/* -------------------------------------------------------
   RECIPROCAL RELATIONSHIP LOGIC
------------------------------------------------------- */
const RECIPROCAL_TYPES: Record<string, string> = {
  Spouse: "Spouse",
  Parent: "Child",
  Child: "Parent",
  Sibling: "Sibling",
  Guardian: "Ward",
  Ward: "Guardian",
};

function getReciprocalType(type: string): string {
  return RECIPROCAL_TYPES[type] || type;
}

/* -------------------------------------------------------
   ADD MEMBER (with reciprocal relationships)
------------------------------------------------------- */
export async function addMember(
  churchId: string,
  data: Partial<Omit<Member, "id">> & { id: string }
) {
  await runTransaction(db, async (transaction) => {
    const relationships = data.relationships || [];

    // 1. Identify related members
    const relatedIds = relationships.map((r) => r.memberIds[1]).filter(Boolean);
    const relatedRefs = relatedIds.map((id) =>
      doc(db, "churches", churchId, "members", id)
    );

    // 2. Read related members
    const relatedDocs = await Promise.all(
      relatedRefs.map((ref) => transaction.get(ref))
    );

    // 3. Update related members with reciprocal relationships
    relatedDocs.forEach((relDoc, index) => {
      if (!relDoc.exists()) return;

      const relId = relatedIds[index];
      const relData = relDoc.data() as Member;
      const newRelInfo = relationships.find((r) => r.memberIds[1] === relId);

      if (!newRelInfo) return;

      const existingRels = relData.relationships || [];

      // Avoid duplicates
      if (!existingRels.some((r) => r.memberIds[1] === data.id)) {
        const reciprocal: Relationship = {
          memberIds: [relId, data.id],
          type: getReciprocalType(newRelInfo.type),
        };

        if (newRelInfo.anniversary) {
          reciprocal.anniversary = newRelInfo.anniversary;
        }

        transaction.update(relatedRefs[index], {
          relationships: [...existingRels, reciprocal],
          updatedAt: serverTimestamp(),
        });
      }
    });

    // 4. Create the new member
    const memberRef = doc(db, "churches", churchId, "members", data.id);
    const payload: any = { ...data };

    if (data.birthday)
      payload.birthday = Timestamp.fromDate(new Date(data.birthday));
    if (data.anniversary)
      payload.anniversary = Timestamp.fromDate(new Date(data.anniversary));
    if (data.baptismDate)
      payload.baptismDate = Timestamp.fromDate(new Date(data.baptismDate));

    payload.createdAt = serverTimestamp();
    payload.updatedAt = serverTimestamp();

    delete payload.id;

    transaction.set(memberRef, removeUndefineds(payload));
  });
}

/* -------------------------------------------------------
   UPDATE MEMBER (with reciprocal relationship updates)
------------------------------------------------------- */
export async function updateMember(
  churchId: string,
  memberId: string,
  data: Partial<Omit<Member, "id">>
) {
  await runTransaction(db, async (transaction) => {
    const memberRef = doc(db, "churches", churchId, "members", memberId);

    // 1. Read current member
    const memberDoc = await transaction.get(memberRef);
    if (!memberDoc.exists()) throw new Error("Member does not exist");

    const currentMember = memberDoc.data() as Member;
    const oldRels = currentMember.relationships || [];
    const newRels = data.relationships;

    // If relationships aren't being updated, update only the member
    if (!newRels) {
      const payload: any = { ...data };
      if (data.birthday)
        payload.birthday = Timestamp.fromDate(new Date(data.birthday));
      if (data.anniversary)
        payload.anniversary = Timestamp.fromDate(new Date(data.anniversary));
      if (data.baptismDate)
        payload.baptismDate = Timestamp.fromDate(new Date(data.baptismDate));
      payload.updatedAt = serverTimestamp();

      transaction.update(memberRef, removeUndefineds(payload));
      return;
    }

    // 2. Determine all related member IDs
    const oldIds = oldRels.map((r) => r.memberIds[1]);
    const newIds = newRels.map((r) => r.memberIds[1]);
    const allRelatedIds = Array.from(new Set([...oldIds, ...newIds])).filter(
      Boolean
    );

    // 3. Read all related members
    const relatedRefs = allRelatedIds.map((id) =>
      doc(db, "churches", churchId, "members", id)
    );
    const relatedDocs = await Promise.all(
      relatedRefs.map((ref) => transaction.get(ref))
    );

    const relatedDocsMap = new Map();
    relatedDocs.forEach((d, i) => {
      if (d.exists()) relatedDocsMap.set(allRelatedIds[i], d);
    });

    // 4. Update reciprocal relationships
    allRelatedIds.forEach((relatedId, index) => {
      const relatedDoc = relatedDocsMap.get(relatedId);
      if (!relatedDoc) return;

      const relatedData = relatedDoc.data() as Member;
      let relatedRels = relatedData.relationships || [];
      const relatedRef = relatedRefs[index];

      const oldRel = oldRels.find((r) => r.memberIds[1] === relatedId);
      const newRel = newRels.find((r) => r.memberIds[1] === relatedId);

      let changed = false;

      if (newRel && !oldRel) {
        // Add reciprocal
        const reciprocal: Relationship = {
          memberIds: [relatedId, memberId],
          type: getReciprocalType(newRel.type),
        };
        if (newRel.anniversary)
          reciprocal.anniversary = newRel.anniversary;

        relatedRels.push(reciprocal);
        changed = true;
      } else if (!newRel && oldRel) {
        // Remove reciprocal
        const initialLength = relatedRels.length;
        relatedRels = relatedRels.filter((r) => r.memberIds[1] !== memberId);
        if (relatedRels.length !== initialLength) changed = true;
      } else if (newRel && oldRel) {
        // Modify reciprocal
        if (
          newRel.type !== oldRel.type ||
          newRel.anniversary !== oldRel.anniversary
        ) {
          const newType = getReciprocalType(newRel.type);
          relatedRels = relatedRels.map((r) => {
            if (r.memberIds[1] === memberId) {
              const updated: Relationship = { ...r, type: newType };
              if (newRel.anniversary)
                updated.anniversary = newRel.anniversary;
              else delete updated.anniversary;
              return updated;
            }
            return r;
          });
          changed = true;
        }
      }

      if (changed) {
        transaction.update(relatedRef, {
          relationships: relatedRels,
          updatedAt: serverTimestamp(),
        });
      }
    });

    // 5. Update main member
    const payload: any = { ...data };
    if (data.birthday)
      payload.birthday = Timestamp.fromDate(new Date(data.birthday));
    if (data.anniversary)
      payload.anniversary = Timestamp.fromDate(new Date(data.anniversary));
    if (data.baptismDate)
      payload.baptismDate = Timestamp.fromDate(new Date(data.baptismDate));

    payload.updatedAt = serverTimestamp();

    transaction.update(memberRef, removeUndefineds(payload));
  });
}

/* -------------------------------------------------------
   DELETE MEMBER (remove reciprocals)
------------------------------------------------------- */
export async function deleteMember(churchId: string, memberId: string) {
  await runTransaction(db, async (transaction) => {
    const memberRef = doc(db, "churches", churchId, "members", memberId);

    const memberDoc = await transaction.get(memberRef);
    if (!memberDoc.exists()) return;

    const memberData = memberDoc.data() as Member;
    const relationships = memberData.relationships || [];

    const relatedIds = relationships.map((r) => r.memberIds[1]).filter(Boolean);
    const relatedRefs = relatedIds.map((id) =>
      doc(db, "churches", churchId, "members", id)
    );
    const relatedDocs = await Promise.all(
      relatedRefs.map((ref) => transaction.get(ref))
    );

    // Remove reciprocals
    relatedDocs.forEach((relDoc, index) => {
      if (!relDoc.exists()) return;

      const relData = relDoc.data() as Member;
      const existing = relData.relationships || [];
      const updated = existing.filter((r) => r.memberIds[1] !== memberId);

      if (updated.length !== existing.length) {
        transaction.update(relatedRefs[index], {
          relationships: updated,
          updatedAt: serverTimestamp(),
        });
      }
    });

    transaction.delete(memberRef);
  });
}

function parseDate(value: any): string | null {
  if (!value) return null;

  // Firestore Timestamp
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString().split("T")[0];
  }

  // Already a string (e.g. "2024-03-10")
  if (typeof value === "string") {
    return value;
  }

  return null;
}

/* -------------------------------------------------------
   LISTEN TO MEMBERS
------------------------------------------------------- */
export function listenToMembers(
  churchId: string,
  callback: (members: Member[]) => void
) {
  const q = query(
    collection(db, "churches", churchId, "members"),
    orderBy("lastName", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const members: Member[] = snapshot.docs.map((doc) => {
        const raw = doc.data();

        return {
          id: doc.id,
          userId: raw.userId ?? null,
          checkInCode: raw.checkInCode ?? "",
          qrCode: raw.qrCode ?? "",
          firstName: raw.firstName ?? "",
          lastName: raw.lastName ?? "",
          email: raw.email ?? "",
          phoneNumber: raw.phoneNumber ?? "",
          profilePhotoUrl: raw.profilePhotoUrl ?? "",
          status: raw.status ?? "",
          address: raw.address ?? null,
          birthday: parseDate(raw.birthday),
          baptismDate: parseDate(raw.baptismDate),
          anniversary: parseDate(raw.anniversary),
          familyId: raw.familyId ?? null,
          notes: raw.notes ?? "",
          relationships: Array.isArray(raw.relationships)
            ? raw.relationships.map((rel: any) => ({
                ...rel,
                memberIds: rel.memberIds as [string, string],
              }))
            : [],
        };
      });

      callback(members);
    },
    (error) => {
      if ((error as { code?: string }).code !== "permission-denied") {
        console.error("listenToMembers error:", error);
      }
    }
  );
}
