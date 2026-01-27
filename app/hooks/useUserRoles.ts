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
    if (!churchId || !user?.uid) {
      setRoles([]);
      setLoading(false);
      return;
    }
  
    const uid = user.uid;
    const email = user.email;
    const safeChurchId = churchId;
  
    let isActive = true;
    setLoading(true);
  
    async function fetchRoles() {
      try {
        let combinedRoles: string[] = [];
  
        // ✅ narrowed uid
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (Array.isArray(userData.roles)) {
            combinedRoles.push(...userData.roles);
          }
        }
  
        // ✅ narrowed churchId and email
        if (email) {
          const membersRef = collection(db, 'churches', safeChurchId, 'members');
          const q = query(membersRef, where('email', '==', email));
          const querySnapshot = await getDocs(q);
  
          if (!querySnapshot.empty) {
            const memberData = querySnapshot.docs[0].data();
            if (Array.isArray(memberData.roles)) {
              combinedRoles.push(...memberData.roles);
            }
          }
        }
  
        if (isActive) {
          setRoles(Array.from(new Set(combinedRoles)));
        }
      } catch (error) {
        console.error("Error fetching user roles:", error);
        if (isActive) setRoles([]);
      } finally {
        if (isActive) setLoading(false);
      }
    }
  
    fetchRoles();
  
    return () => {
      isActive = false;
    };
  }, [user?.uid, user?.email, churchId]);  

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
