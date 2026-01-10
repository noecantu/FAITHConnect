import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

export function useChurchId(): string | null {
  const { user } = useAuth();
  const [churchId, setChurchId] = useState<string | null>(null);

  useEffect(() => {
    const fetchChurchId = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setChurchId(userDoc.data().churchId);
        } else {
          console.warn(`User document not found for uid: ${user.uid}`);
          setChurchId(null);
        }
      } else {
        setChurchId(null);
      }
    };

    fetchChurchId();
  }, [user]);

  return churchId;
}
