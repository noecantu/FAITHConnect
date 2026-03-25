import { doc, deleteDoc } from "firebase/firestore";
import { db } from '@/app/lib/firebase/client';

export async function deleteAttendanceDay(churchId: string, dateString: string) {
  const ref = doc(db, `churches/${churchId}/attendance/${dateString}`);
  await deleteDoc(ref);
}
