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

  // Relationship search feeds into the same search bar
  function handleSearchFromRelationship(name: string) {
    setSearch(name);
  }

  useEffect(() => {
    if (!churchId) return;

    const unsubscribe = listenToMembers(churchId, setMembers);
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
      <PageHeader title="Members" className="mb-2">
        {isMemberManager && (
          <MemberFormSheet>
            <Button>Add Member</Button>
          </MemberFormSheet>
        )}
      </PageHeader>

      <div>
        <MemberStatusBreakdown members={members} />
      </div>

      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex items-center gap-02">
          <Input
            className="w-full"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setSearch("")}
              className="shrink-0"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {sortedMembers.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            onSearch={handleSearchFromRelationship}
          />
        ))}
      </div>
    </>
  );
}
