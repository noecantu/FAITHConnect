import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export function useChurchId(): { churchId: string | null; loading: boolean } {
  const { user, loading: authLoading } = useAuth();
  const [churchId, setChurchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    // Reset loading whenever the user changes
    setLoading(true);
    setChurchId(null);

    if (authLoading) return;

    if (!user?.id) {
      if (isActive) {
        setChurchId(null);
        setLoading(false);
      }
      return;
    }

    const fetchChurchId = async () => {
      try {
        const userDocRef = doc(db, "users", user.id);
        const userDoc = await getDoc(userDocRef);

        if (!isActive) return;

        if (userDoc.exists()) {
          setChurchId(userDoc.data().churchId ?? null);
        } else {
          setChurchId(null);
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchChurchId();

    return () => {
      isActive = false;
    };
  }, [authLoading, user?.id]);

  return { churchId, loading };
}


