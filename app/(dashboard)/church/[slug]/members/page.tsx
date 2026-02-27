'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { PageHeader } from '@/app/components/page-header';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Fab } from '@/app/components/ui/fab';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';

import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { useSettings } from '@/app/hooks/use-settings';
import { useAuth } from '@/app/hooks/useAuth';

import { listenToMembers } from '@/app/lib/members';
import type { Member } from '@/app/lib/types';

import MemberCard from './MemberCard';

import { updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

export default function MembersPage() {
  const router = useRouter();
  const { churchId } = useChurchId();
  const { isMemberManager } = useUserRoles(churchId);
  const { cardView } = useSettings();
  const { user } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [previousScroll, setPreviousScroll] = useState(0);

  // Relationship search feeds into the same search bar
  function handleSearchFromRelationship(name: string) {
    setPreviousScroll(window.scrollY);
    setSearch(name);
  }

  // Real-time listener
  useEffect(() => {
    if (!churchId || !user) return;

    const unsubscribe = listenToMembers(churchId, setMembers);
    return () => unsubscribe();
  }, [churchId, user]);

  // Filtering
  const filteredMembers = useMemo(() => {
    const term = search.toLowerCase();

    return members.filter((m) => {
      const name = `${m.firstName} ${m.lastName}`.toLowerCase();
      const email = m.email?.toLowerCase() ?? '';
      const phone = m.phoneNumber ?? '';
      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term)
      );
    });
  }, [members, search]);

  // Sorting
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      const nameA = `${a.lastName}, ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName}, ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [filteredMembers]);

  // Status summary
  const statusSummary = useMemo(() => {
    const active = members.filter((m) => m.status === 'Active').length;
    const prospect = members.filter((m) => m.status === 'Prospect').length;
    const archived = members.filter((m) => m.status === 'Archived').length;

    return `Active: ${active} | Prospects: ${prospect} | Archived: ${archived}`;
  }, [members]);

  // Clear search + restore scroll
  function handleClear() {
    setSearch('');

    requestAnimationFrame(() => {
      window.scrollTo(0, previousScroll);
    });
  }

  return (
    <>
      {/* HEADER */}
      <PageHeader title="Members" subtitle={statusSummary}>
        <div className="flex items-center gap-4">
          {/* View Selector */}
          <RadioGroup
            value={cardView}
            onValueChange={async (value) => {
              const v = value as 'show' | 'hide';

              if (!user?.id) return;

              await updateDoc(doc(db, 'users', user.id), {
                'settings.cardView': v,
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

      {/* SEARCH BAR */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full flex items-center gap-2">
          <Input
            className="w-full"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search.length > 0 && (
            <Button variant="outline" onClick={handleClear} className="shrink-0">
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* MEMBERS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {sortedMembers.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            allMembers={members}
            showPhoto={cardView === 'show'}
            searchAction={handleSearchFromRelationship}
          />
        ))}
      </div>

      {/* FAB */}
      {isMemberManager && (
        <Fab
          type="add"
          onClick={() => router.push(`/church/${churchId}/members/new`)}
        />
      )}
    </>
  );
}
