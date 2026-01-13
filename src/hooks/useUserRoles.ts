'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

export function useUserRoles(churchId: string | null) {
  const { user } = useAuth();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      if (!user || !churchId) {
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        let combinedRoles: string[] = [];

        // 1. Fetch roles from the 'users' collection (Account Owner / Admin)
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.roles && Array.isArray(userData.roles)) {
            combinedRoles = [...combinedRoles, ...userData.roles];
          }
        }

        // 2. Fetch roles from the 'members' collection (Staff / Members)
        // We link the Auth User to the Member record via Email.
        if (user.email) {
          const membersRef = collection(db, 'churches', churchId, 'members');
          const q = query(membersRef, where('email', '==', user.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            // Assuming email is unique, take the first match
            const memberDoc = querySnapshot.docs[0];
            const memberData = memberDoc.data();
            if (memberData.roles && Array.isArray(memberData.roles)) {
              combinedRoles = [...combinedRoles, ...memberData.roles];
            }
          }
        }

        // Remove duplicates
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
    isEventManager: roles.includes('Admin') || roles.includes('EventManager')
  };
}
