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
import { Fab } from "@/components/ui/fab";
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/useAuth";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function MembersPage() {
  const churchId = useChurchId();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const { isMemberManager } = useUserRoles(churchId);
  const [previousScroll, setPreviousScroll] = useState(0);
  const { cardView } = useSettings();
  const { user } = useAuth();
  
  // Relationship search feeds into the same search bar
  function handleSearchFromRelationship(name: string) {
    setPreviousScroll(window.scrollY);
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

  const statusSummary = getMemberStatusSummary(members);

  function handleClear() {
    setSearch("");
  
    // Restore scroll AFTER the DOM updates
    requestAnimationFrame(() => {
      window.scrollTo(0, previousScroll);
    });
  }

  function getMemberStatusSummary(members: Member[]) {
    const active = members.filter(m => m.status === "Active").length;
    const prospect = members.filter(m => m.status === "Prospect").length;
    const archived = members.filter(m => m.status === "Archived").length;
  
    return `Active Members: ${active} | Prospects: ${prospect} | Archived: ${archived}`;
  }
  
  return (
    <>
      <PageHeader
        title="Members"
        subtitle={statusSummary}
        className="mb-2"
      >
        <div className="flex items-center gap-4">
          {/* View Selector */}
          <RadioGroup
            value={cardView}
            onValueChange={async (value) => {
              const v = value as "show" | "hide";

              if (!user?.uid) return;

              await updateDoc(doc(db, "users", user.uid), {
                "settings.cardView": v,
                updatedAt: serverTimestamp(),
              });
            }}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-1">
              <RadioGroupItem value="show" id="show-photo" />
              <label htmlFor="show-photo" className="text-sm">Show Photo</label>
            </div>

            <div className="flex items-center gap-1">
              <RadioGroupItem value="hide" id="hide-photo" />
              <label htmlFor="hide-photo" className="text-sm">Hide Photo</label>
            </div>
          </RadioGroup>
        </div>
      </PageHeader>

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
              onClick={handleClear}
              className="shrink-0"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
          gap-6
        "
      >

        {sortedMembers.map((member) => (
          <MemberCard
          key={member.id}
          member={member}
          cardView={cardView}
          onSearch={handleSearchFromRelationship}
        />        
        ))}
      </div>

      {isMemberManager && (
        <MemberFormSheet>
          <Fab type="add" />
        </MemberFormSheet>
      )}

    </>
  );
}
