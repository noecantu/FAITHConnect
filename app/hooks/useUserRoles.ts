'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export function useUserRoles(churchId: string | null) {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !churchId) {
      setRoles([]);
      setLoading(false);
      return;
    }

    const uid = user.id; // TS now knows this is a string

    let isActive = true;
    setLoading(true);

    async function fetchRoles() {
      try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);

        if (!isActive) return;

        if (userDoc.exists()) {
          const data = userDoc.data();
          const userRoles = Array.isArray(data.roles) ? data.roles : [];
          setRoles(userRoles);
        } else {
          setRoles([]);
        }
      } catch (error) {
        if (isActive) {
          console.error("Error fetching user roles:", error);
          setRoles([]);
        }
      } finally {
        if (isActive) setLoading(false);
      }
    }

    fetchRoles();
    return () => { isActive = false };
  }, [user?.id, churchId]);

  return {
    roles,
    loading,
    isAdmin: roles.includes('Admin'),
    isMemberManager: roles.includes('Admin') || roles.includes('MemberManager'),
    isFinance: roles.includes('Admin') || roles.includes('Finance'),
    isEventManager: roles.includes('Admin') || roles.includes('EventManager'),
    isMusicManager: roles.includes('Admin') || roles.includes('MusicManager'),
    isMusicMember: roles.includes('Admin') || roles.includes('MusicMember'),
    isServiceManager: roles.includes('Admin') || roles.includes('ServiceManager'),
  };
}
