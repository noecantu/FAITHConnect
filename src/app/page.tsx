'use client';

import { useEffect, useState } from "react";
import { listenToMembers } from "@/lib/members";
import { Member } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { MemberCard } from "@/app/members/member-card";
import { MemberStatusBreakdown } from "@/app/members/member-status-breakdown";
import { useChurchId } from "@/hooks/useChurchId";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MemberFormSheet } from "@/app/members/member-form-sheet";
import { useAuth } from "@/hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function MembersPage() {
  const churchId = useChurchId();
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [canAdd, setCanAdd] = useState(false);

  useEffect(() => {
    if (!churchId) return;

    const unsubscribe = listenToMembers(
      churchId,
      (loadedMembers: Member[]) => {
        setMembers(loadedMembers);
      }
    );

    return () => unsubscribe();
  }, [churchId]);

  useEffect(() => {
    const checkPermission = async () => {
      if (user && churchId) {
        // In a real app with custom claims, we'd check the token.
        // Here we'll fetch the user doc as we've done elsewhere.
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const roles = userDoc.data().roles || [];
                if (roles.includes('Admin') || roles.includes('MemberManager')) {
                    setCanAdd(true);
                } else {
                    setCanAdd(false);
                }
            }
        } catch (error) {
            console.error("Error fetching user roles:", error);
            setCanAdd(false);
        }
      } else {
        setCanAdd(false);
      }
    };
    checkPermission();
  }, [user, churchId]);

  return (
    <>
      <PageHeader title="Members" className="mb-2">
        {canAdd && (
          <MemberFormSheet>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </MemberFormSheet>
        )}
      </PageHeader>
      <MemberStatusBreakdown members={members} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </>
  );
}
