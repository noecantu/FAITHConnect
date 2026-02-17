import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  runTransaction,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Member, MemberFirestore, Relationship } from "./types";
import { removeUndefineds } from "./utils";

const RECIPROCAL_TYPES: Record<string, string> = {
  Spouse: "Spouse",
  Parent: "Child",
  Child: "Parent",
  Sibling: "Sibling",
  Guardian: "Ward",
  Ward: "Guardian",
};
import type { DocumentSnapshot, DocumentData } from "firebase/firestore";

function getReciprocalType(type: string): string {
  return RECIPROCAL_TYPES[type] || type;
}

function generateCheckInCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 1, 0
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function generateUniqueCheckInCode(churchId: string): Promise<string> {
  let code = "";
  let exists = true;

  while (exists) {
    code = generateCheckInCode();

    const membersRef = collection(db, "churches", churchId, "members");
    const q = query(membersRef, where("checkInCode", "==", code));
    const snap = await getDocs(q);

    exists = !snap.empty;
  }

  return code;
}

// ------------------------------
// ADD MEMBER
// ------------------------------
export async function addMember(
  churchId: string,
  data: Partial<Omit<Member, "id">> & { id: string }
) {
  const checkInCode = await generateUniqueCheckInCode(churchId);

  await runTransaction(db, async (transaction) => {
    const relationships = data.relationships ?? [];

    const relatedIds = relationships
      .map((r) => r.memberIds[1])
      .filter(Boolean);

    const relatedRefs = relatedIds.map((id) =>
      doc(db, "churches", churchId, "members", id)
    );

    const relatedDocs = await Promise.all(
      relatedRefs.map((ref) => transaction.get(ref))
    );

    relatedDocs.forEach((relDoc, index) => {
      if (!relDoc.exists()) return;

      const relId = relatedIds[index];
      const relData = relDoc.data() as Member;

      const newRelInfo = relationships.find(
        (r) => r.memberIds[1] === relId
      );
      if (!newRelInfo) return;

      const existingRels = relData.relationships ?? [];

      const alreadyExists = existingRels.some(
        (r) => r.memberIds[1] === data.id
      );
      if (alreadyExists) return;

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
    });

    const memberRef = doc(db, "churches", churchId, "members", data.id);

    const {
      birthday,
      baptismDate,
      anniversary,
      ...rest
    } = data;

    const payload: Partial<MemberFirestore> = {
      ...rest,
      checkInCode,
      phoneNumber: data.phoneNumber?.replace(/\D/g, "") || undefined,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    if (birthday)
      payload.birthday = Timestamp.fromDate(new Date(birthday));

    if (baptismDate)
      payload.baptismDate = Timestamp.fromDate(new Date(baptismDate));

    if (anniversary)
      payload.anniversary = Timestamp.fromDate(new Date(anniversary));

    delete payload.id;

    transaction.set(memberRef, removeUndefineds(payload));
  });
}

// ------------------------------
// UPDATE MEMBER
// ------------------------------
export async function updateMember(
  churchId: string,
  memberId: string,
  data: Partial<Omit<Member, "id">>
) {
  await runTransaction(db, async (transaction) => {
    const memberRef = doc(db, "churches", churchId, "members", memberId);

    const memberDoc = await transaction.get(memberRef);
    if (!memberDoc.exists()) throw new Error("Member does not exist");

    const currentMember = memberDoc.data() as Member;
    const oldRels = currentMember.relationships ?? [];
    const newRels = data.relationships;

    // ------------------------------
    // SIMPLE UPDATE (no relationships)
    // ------------------------------
    if (!newRels) {
      const {
        birthday,
        baptismDate,
        anniversary,
        ...rest
      } = data;

      const payload: Partial<MemberFirestore> = {
        ...rest,
        phoneNumber: data.phoneNumber?.replace(/\D/g, "") || undefined,
        updatedAt: serverTimestamp() as Timestamp,
      };

      if (birthday)
        payload.birthday = Timestamp.fromDate(new Date(birthday));

      if (baptismDate)
        payload.baptismDate = Timestamp.fromDate(new Date(baptismDate));

      if (anniversary)
        payload.anniversary = Timestamp.fromDate(new Date(anniversary));

      transaction.update(memberRef, removeUndefineds(payload));
      return;
    }

    // ------------------------------
    // RELATIONSHIP UPDATE LOGIC
    // ------------------------------
    const oldIds = oldRels.map((r) => r.memberIds[1]);
    const newIds = newRels.map((r) => r.memberIds[1]);
    const allRelatedIds = Array.from(new Set([...oldIds, ...newIds])).filter(Boolean);

    const relatedRefs = allRelatedIds.map((id) =>
      doc(db, "churches", churchId, "members", id)
    );
    const relatedDocs = await Promise.all(
      relatedRefs.map((ref) => transaction.get(ref))
    );

    const relatedDocsMap = new Map<string, DocumentSnapshot<DocumentData>>();
    relatedDocs.forEach((d, i) => {
      if (d.exists()) relatedDocsMap.set(allRelatedIds[i], d);
    });

    // Update related members
    allRelatedIds.forEach((relatedId, index) => {
      const relatedDoc = relatedDocsMap.get(relatedId);
      if (!relatedDoc) return;

      const relatedData = relatedDoc.data() as Member;
      let relatedRels = relatedData.relationships ?? [];
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
        const before = relatedRels.length;
        relatedRels = relatedRels.filter((r) => r.memberIds[1] !== memberId);
        if (relatedRels.length !== before) changed = true;
      } else if (newRel && oldRel) {
        // Modify reciprocal
        if (
          newRel.type !== oldRel.type ||
          newRel.anniversary !== oldRel.anniversary
        ) {
          const newType = getReciprocalType(newRel.type);
          relatedRels = relatedRels.map((r) => {
            if (r.memberIds[1] === memberId) {
              const updated: Relationship = {
                ...r,
                type: newType,
              };
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

    // ------------------------------
    // UPDATE MAIN MEMBER
    // ------------------------------
    const {
      birthday,
      baptismDate,
      anniversary,
      ...rest
    } = data;

    const payload: Partial<MemberFirestore> = {
      ...rest,
      phoneNumber: data.phoneNumber?.replace(/\D/g, "") || undefined,
      updatedAt: serverTimestamp() as Timestamp,
    };

    if (birthday)
      payload.birthday = Timestamp.fromDate(new Date(birthday));

    if (baptismDate)
      payload.baptismDate = Timestamp.fromDate(new Date(baptismDate));

    if (anniversary)
      payload.anniversary = Timestamp.fromDate(new Date(anniversary));

    transaction.update(memberRef, removeUndefineds(payload));
  });
}

// ------------------------------
// DELETE MEMBER
// ------------------------------
export async function deleteMember(churchId: string, memberId: string) {
  await runTransaction(db, async (transaction) => {
    const memberRef = doc(db, "churches", churchId, "members", memberId);

    const memberDoc = await transaction.get(memberRef);
    if (!memberDoc.exists()) return;

    const memberData = memberDoc.data() as Member;
    const relationships = memberData.relationships ?? [];

    const relatedIds = relationships.map((r) => r.memberIds[1]).filter(Boolean);
    const relatedRefs = relatedIds.map((id) =>
      doc(db, "churches", churchId, "members", id)
    );
    const relatedDocs = await Promise.all(
      relatedRefs.map((ref) => transaction.get(ref))
    );

    relatedDocs.forEach((relDoc, index) => {
      if (!relDoc.exists()) return;

      const relData = relDoc.data() as Member;
      const existing = relData.relationships ?? [];
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

// ------------------------------
// LISTEN TO MEMBERS
// ------------------------------
export function listenToMembers(
  churchId: string,
  callback: (members: Member[]) => void
) {
  if (!churchId) return () => {};

  const q = query(
    collection(db, "churches", churchId, "members"),
    orderBy("lastName", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const members: Member[] = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data();

        return {
          id: docSnap.id,
          userId: raw.userId ?? null,
          checkInCode: raw.checkInCode ?? "",
          firstName: raw.firstName ?? null,
          lastName: raw.lastName ?? null,
          email: raw.email ?? "",
          phoneNumber: raw.phoneNumber?.replace(/\D/g, "") ?? "",
          profilePhotoUrl: raw.profilePhotoUrl ?? "",
          status: raw.status ?? "",
          address: raw.address ?? "",
          birthday: raw.birthday
            ? raw.birthday.toDate().toISOString().split("T")[0]
            : undefined,
          baptismDate: raw.baptismDate
            ? raw.baptismDate.toDate().toISOString().split("T")[0]
            : undefined,
          anniversary: raw.anniversary
            ? raw.anniversary.toDate().toISOString().split("T")[0]
            : undefined,
          familyId: raw.familyId ?? null,
          notes: raw.notes ?? "",
          relationships: raw.relationships ?? [],
        };

      });

      callback(members);
    },
    (error) => {
      if (error.code !== "permission-denied") {
        console.error("listenToMembers error:", error);
      }
    }
  );
}
