import {
  collection,
  query,
  where,
  documentId,
  getDocs,
} from "firebase/firestore";
import { getWeekRange } from "@/app/lib/getWeekRange";
import { db } from "@/app/lib/firebase";

export async function getAttendanceThisWeek(churchId: string) {
  const { startString, endString } = getWeekRange();

  const attendanceRef = collection(
    db,
    "churches",
    churchId,
    "attendance"
  );

  const q = query(
    attendanceRef,
    where(documentId(), ">=", startString),
    where(documentId(), "<=", endString)
  );

  const snapshot = await getDocs(q);

  let total = 0;

  snapshot.forEach(doc => {
    const data = doc.data();

    const memberCount = Object.keys(data.members || {}).length;

    const visitorCount =
      typeof data.visitors === "number"
        ? data.visitors
        : Object.keys(data.visitors || {}).length;

    total += memberCount + visitorCount;
  });

  return total;
}
