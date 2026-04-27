//app/(dashboard)/church/[slug]/members/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { PageHeader } from '@/app/components/page-header';
import { Fab } from '@/app/components/ui/fab';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';

import { useChurchId } from '@/app/hooks/useChurchId';
import { usePermissions } from '@/app/hooks/usePermissions';
import { useSettings } from '@/app/hooks/use-settings';
import { useAuth } from '@/app/hooks/useAuth';

import { listenToMembers } from '@/app/lib/members';
import type { Member } from '@/app/lib/types';

import MemberCard from '@/app/components/members/MemberCard';
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { SearchBar } from '@/app/components/ui/search-bar';

export default function MembersPage() {
  const supabase = getSupabaseClient();
  const router = useRouter();
  const { church_id } = useChurchId();

  const { canManageMembers, isAuditor, isRegionalAdmin } = usePermissions();

  // Regional Admins AND Auditors are read-only
  const isReadOnly = isAuditor || isRegionalAdmin;

  // Only true for Church Admin + Root Admin
  const canEdit = !isReadOnly && canManageMembers;

  const { settings } = useSettings(church_id ?? undefined);
  const cardView = (settings?.cardView ?? 'show') as 'show' | 'hide';
  const { user } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');

  // Real-time listener
  useEffect(() => {
    if (!church_id || !user) return;

    const unsubscribe = listenToMembers(church_id, setMembers);
    return () => unsubscribe();
  }, [church_id, user]);

  // Filtering
  const filteredMembers = useMemo(() => {
    const term = search.toLowerCase();

    return members.filter((m) => {
      const name = `${m.first_name} ${m.last_name}`.toLowerCase();
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
      const nameA = `${a.last_name}, ${a.first_name}`.toLowerCase();
      const nameB = `${b.last_name}, ${b.first_name}`.toLowerCase();
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

  return (
    <>
      {/* HEADER */}
      <PageHeader title="Members" subtitle={statusSummary}>
        <div className="flex flex-wrap justify-end items-center gap-4 w-full">

          {/* Hide Show/Hide Photo for Regional Admins */}
          {!isReadOnly && (
            <RadioGroup
              value={cardView}
              onValueChange={async (value) => {
                const v = value as 'show' | 'hide';

                if (!user?.uid) return;

                const { data: current } = await supabase
                  .from('users')
                  .select('settings')
                  .eq('id', user.uid)
                  .single();

                const mergedSettings = {
                  ...((current?.settings as Record<string, unknown> | null) ?? {}),
                  cardView: v,
                };

                await supabase
                  .from('users')
                  .update({ settings: mergedSettings, updated_at: new Date().toISOString() })
                  .eq('id', user.uid);
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
          )}

        </div>
      </PageHeader>

      {/* SEARCH BAR */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search Members..."
      />

      {/* MEMBERS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {sortedMembers.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          allMembers={members}
          showPhoto={cardView === 'show'}
          readOnly={isReadOnly}
          searchAction={setSearch}
        />
        ))}
      </div>

      {/* FAB */}
      {canEdit && (
        <Fab
          type="add"
          onClick={() => router.push(`/church/${church_id}/members/new`)}
        />
      )}
    </>
  );
}
