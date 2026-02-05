import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export function useChurchId(): string | null {
  const { user } = useAuth();
  const [churchId, setChurchId] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    // If user logs out, clear immediately and stop
    if (!user?.id) {
      setChurchId(null);
      return () => { isActive = false };
    }

    const uid = user.id;

    const fetchChurchId = async () => {
      try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);

        if (!isActive) return;

        if (userDoc.exists()) {
          setChurchId(userDoc.data().churchId);
        } else {
          setChurchId(null);
        }
      } catch (err) {
        if (isActive) {
          console.error("Error fetching churchId:", err);
          setChurchId(null);
        }
      }
    };

    fetchChurchId();

    return () => {
      isActive = false;
    };
  }, [user?.id]);

  return churchId;
}
