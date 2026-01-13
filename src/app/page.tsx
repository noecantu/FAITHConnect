'use client';

import { useEffect, useState, useMemo } from "react";
import { listenToMembers } from "@/lib/members";
import { Member } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { MemberCard } from "@/app/members/member-card";
import { MemberStatusBreakdown } from "@/app/members/member-status-breakdown";
import { useChurchId } from "@/hooks/useChurchId";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [members]);

  return (
    <>
      <PageHeader title="Members" className="mb-2">
        {isMemberManager && (
          <MemberFormSheet>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </MemberFormSheet>
        )}
      </PageHeader>
      <MemberStatusBreakdown members={members} />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedMembers.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </>
  );
}
