import {
  collection,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Member } from "./types";

// LISTEN TO MEMBERS
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
          qrCode: raw.qrCode ?? "",
          firstName: raw.firstName ?? "",
          lastName: raw.lastName ?? "",
          email: raw.email ?? "",
          phoneNumber: raw.phoneNumber?.replace(/\D/g, "") ?? "",
          profilePhotoUrl: raw.profilePhotoUrl ?? "",
          status: raw.status ?? "",
          address: raw.address ?? "",
          birthday: raw.birthday
            ? raw.birthday instanceof Timestamp
              ? raw.birthday.toDate().toISOString().split("T")[0]
              : raw.birthday // already a string
            : undefined,
          baptismDate: raw.baptismDate
            ? raw.baptismDate instanceof Timestamp
              ? raw.baptismDate.toDate().toISOString().split("T")[0]
              : raw.baptismDate
            : undefined,

          anniversary: raw.anniversary
            ? raw.anniversary instanceof Timestamp
              ? raw.anniversary.toDate().toISOString().split("T")[0]
              : raw.anniversary
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
