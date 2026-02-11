import { doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function deleteAttendanceDay(churchId: string, dateString: string) {
  const ref = doc(db, `churches/${churchId}/attendance/${dateString}`);
  await deleteDoc(ref);
}
