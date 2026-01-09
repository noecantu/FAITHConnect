'use client';

import { useEffect, useState } from "react";
import { listenToMembers } from "@/lib/members";
import { Member } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { MemberCard } from "@/app/members/member-card";
import { useChurchId } from "@/hooks/useChurchId";

export default function MembersPage() {
  const churchId = useChurchId();
  const [members, setMembers] = useState<Member[]>([]);

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
      <PageHeader title="Members" />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {members.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </>
  );
}