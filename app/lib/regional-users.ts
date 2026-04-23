import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/app/lib/firebase/client';

type RegionalUserRecord = {
  uid: string;
  roles?: string[];
  churchId?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePhotoUrl?: string | null;
};

export async function getUsersByChurchIds(churchIds: string[]): Promise<RegionalUserRecord[]> {
  const normalizedChurchIds = Array.from(new Set(churchIds.filter(Boolean)));

  if (normalizedChurchIds.length === 0) {
    return [];
  }

  const userSnapshots = await Promise.all(
    normalizedChurchIds.map((churchId) =>
      getDocs(query(collection(db, 'users'), where('churchId', '==', churchId)))
    )
  );

  const users = new Map<string, RegionalUserRecord>();

  userSnapshots.forEach((snapshot) => {
    snapshot.docs.forEach((docSnap) => {
      users.set(docSnap.id, {
        uid: docSnap.id,
        ...(docSnap.data() as Omit<RegionalUserRecord, 'uid'>),
      });
    });
  });

  return Array.from(users.values());
}