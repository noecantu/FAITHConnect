'use client';

import { useMemo } from 'react';
import { Member, Contribution } from '../lib/types';

interface UseReportFiltersProps {
  members: Member[];
  contributions: Contribution[];

  selectedMembers: string[];
  selectedStatus: string[];
  selectedFY: string[];
  selectedCategories: string[];
  selectedContributionTypes: string[];
}

export function useReportFilters({
  members,
  contributions,
  selectedMembers,
  selectedStatus,
  selectedFY,
  selectedCategories,
  selectedContributionTypes,
}: UseReportFiltersProps) {
  /**
   * Available fiscal years (derived from contributions)
   */
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    contributions.forEach((c) => {
      years.add(new Date(c.date).getFullYear().toString());
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [contributions]);

  /**
   * Filtered Members
   */
  const filteredMembers = useMemo(() => {
    if (selectedMembers.length === 0) return [];

    let list = members;

    // Member filter
    list = list.filter((m) => selectedMembers.includes(m.id));

    // Status filter
    if (selectedStatus.length > 0) {
      list = list.filter((m) => selectedStatus.includes(m.status));
    }

    return list;
  }, [members, selectedMembers, selectedStatus]);

  /**
   * Filtered Contributions
   */
  const filteredContributions = useMemo(() => {
    if (selectedMembers.length === 0) return [];
    if (selectedFY.length === 0) return [];

    let list = contributions;

    // Year filter
    list = list.filter((c) =>
      selectedFY.includes(new Date(c.date).getFullYear().toString())
    );

    // Member filter
    list = list.filter((c) => selectedMembers.includes(c.memberId));

    // Status filter
    if (selectedStatus.length > 0) {
      list = list.filter((c) => {
        const member = members.find((m) => m.id === c.memberId);
        return member && selectedStatus.includes(member.status);
      });
    }

    // Category filter
    if (selectedCategories.length > 0) {
      list = list.filter((c) => selectedCategories.includes(c.category));
    }

    // Contribution type filter
    if (selectedContributionTypes.length > 0) {
      list = list.filter((c) =>
        selectedContributionTypes.includes(c.contributionType)
      );
    }

    return list;
  }, [
    contributions,
    members,
    selectedFY,
    selectedMembers,
    selectedStatus,
    selectedCategories,
    selectedContributionTypes,
  ]);

  return {
    availableYears,
    filteredMembers,
    filteredContributions,
  };
}
