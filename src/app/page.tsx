'use client';

import { useEffect, useState } from "react";
import { listenToMembers } from "@/lib/members";
import { Member } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { MemberCard } from "@/app/members/member-card";
import { MemberStatusBreakdown } from "@/app/members/member-status-breakdown";
import { useChurchId } from "@/hooks/useChurchId";
import { Button } from "@/components/ui/button";
import { MemberFormSheet } from "@/app/members/member-form-sheet";
import { useUserRoles } from "@/hooks/useUserRoles";

export default function MembersPage() {
  const churchId = useChurchId();
  const [members, setMembers] = useState<Member[]>([]);
  const { isMemberManager } = useUserRoles(churchId);

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

  return (
    <>
      <PageHeader title="Members" className="mb-2">
        {isMemberManager && (
          <MemberFormSheet>
            <Button>
              Add Member
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
