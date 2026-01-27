'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';

export function useUserRoles(churchId: string | null) {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      // Stay in loading state until both user and churchId exist
      if (!user || !churchId) {
        setRoles([]);
        setLoading(true);
        return;
      }

      try {
        let combinedRoles: string[] = [];

        // 1. Fetch roles from /users/{uid}
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (Array.isArray(userData.roles)) {
            combinedRoles.push(...userData.roles);
          }
        }

        // 2. Fetch roles from /churches/{churchId}/members
        if (user.email) {
          const membersRef = collection(db, 'churches', churchId, 'members');
          const q = query(membersRef, where('email', '==', user.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const memberData = querySnapshot.docs[0].data();
            if (Array.isArray(memberData.roles)) {
              combinedRoles.push(...memberData.roles);
            }
          }
        }

        setRoles(Array.from(new Set(combinedRoles)));
      } catch (error) {
        console.error("Error fetching user roles:", error);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRoles();
  }, [user, churchId]);

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
