'use client';

import { useMemo } from 'react';
import type { Member } from '../lib/types';

interface MemberStatusBreakdownProps {
  members: Member[];
}

export function MemberStatusBreakdown({ members }: MemberStatusBreakdownProps) {
  const statusCounts = useMemo(() => {
    const counts = {
      Active: 0,
      Prospect: 0,
      Archived: 0,
    };
    members.forEach(member => {
      if (counts[member.status] !== undefined) {
        counts[member.status]++;
      }
    });
    return counts;
  }, [members]);

  return (
    <div className="mb-6 flex items-center space-x-4 text-sm text-muted-foreground">
      <span>Active Members: {statusCounts.Active}</span>
      <span className="h-4 w-px bg-gray-300" />
      <span>Prospects: {statusCounts.Prospect}</span>
      <span className="h-4 w-px bg-gray-300" />
      <span>Archived: {statusCounts.Archived}</span>
    </div>
  );
}
