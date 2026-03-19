import { useMemo } from "react";
import { Member } from "../lib/types";

export interface UseMemberReportProps {
  members: Member[];
  selectedMembers: string[];
  selectedStatus: string[];
}

export function useMemberReport({
  members,
  selectedMembers,
  selectedStatus,
}: UseMemberReportProps) {
  const list = useMemo<Member[]>(() => {
    let filtered = members;

    if (selectedMembers.length > 0) {
      filtered = filtered.filter((m: Member) =>
        selectedMembers.includes(m.id)
      );
    }

    if (selectedStatus.length > 0) {
      filtered = filtered.filter((m: Member) =>
        selectedStatus.includes(m.status)
      );
    }

    return filtered;
  }, [members, selectedMembers, selectedStatus]);

  return {
    filteredMembers: list,
  };
}
