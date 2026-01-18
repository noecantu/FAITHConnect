'use client';

import { useEffect, useState, useMemo } from "react";
import { listenToMembers } from "@/lib/members";
import { Member } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { MemberCard } from "@/app/members/member-card";
import { MemberStatusBreakdown } from "@/app/members/member-status-breakdown";
import { useChurchId } from "@/hooks/useChurchId";
import { Button } from "@/components/ui/button";
import { MemberFormSheet } from "@/app/members/member-form-sheet";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Input } from "@/components/ui/input";

export default function MembersPage() {
  const churchId = useChurchId();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
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

  const filteredMembers = useMemo(() => {
    const term = search.toLowerCase();

    return members.filter((m) => {
      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
      const email = m.email?.toLowerCase() ?? "";
      const phone = m.phoneNumber ?? "";
      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term)
      );
    });
  }, [members, search]);

  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [filteredMembers]);

  return (
    <>
      {/* TITLE + ADD MEMBER BUTTON */}
      <PageHeader title="Members">
        {isMemberManager && (
          <MemberFormSheet>
            <Button>Add Member</Button>
          </MemberFormSheet>
        )}
      </PageHeader>
  
      {/* BREAKDOWN DIRECTLY UNDER TITLE */}
      <div className="mb-0">
        <MemberStatusBreakdown members={members} />
      </div>
  
      {/* SEARCH BAR IMMEDIATELY UNDER TITLE + BREAKDOWN */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-1">
        <div className="w-full max-w-md flex items-center gap-0">
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
  
          {search.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => setSearch("")}
              className="shrink-0"
            >
              Clear
            </Button>
          )}
        </div>
      </div>
  
      {/* MASONRY LAYOUT */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {sortedMembers.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>
    </>
  );
}