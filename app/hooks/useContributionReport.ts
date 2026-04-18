import { useMemo } from "react";
import { Contribution, Member } from "../lib/types";

export interface UseContributionReportProps {
  contributions: Contribution[];
  members: Member[];
  selectedMembers: string[];
  selectedStatus: string[];
  selectedCategories: string[];
  selectedContributionTypes: string[];
  timeFrame: "month" | "year";
  selectedYear: string | null;
  selectedMonth: string | null;
}

export function useContributionReport({
  contributions,
  members,
  selectedMembers,
  selectedStatus,
  selectedCategories,
  selectedContributionTypes,
  timeFrame,
  selectedYear,
  selectedMonth,
}: UseContributionReportProps) {
  // MEMBER FILTER (robust)
  const memberFiltered = useMemo<Contribution[]>(() => {
    if (selectedMembers.length === 0) return contributions;

    return contributions.filter((c: Contribution) => {
      if (c.memberId && selectedMembers.includes(c.memberId)) return true;

      const match = members.find((m: Member) => {
        const full = `${m.firstName} ${m.lastName}`.trim();
        return selectedMembers.includes(m.id) && c.memberName === full;
      });

      return Boolean(match);
    });
  }, [contributions, selectedMembers, members]);

  // DATE FILTERS
  let list: Contribution[] = memberFiltered;

  if (timeFrame === "year" && selectedYear) {
    list = list.filter((c: Contribution) => {
      const d = new Date(c.date);
      return d.getFullYear().toString() === selectedYear;
    });
  }

  if (timeFrame === "month" && selectedYear && selectedMonth) {
    list = list.filter((c: Contribution) => {
      const d = new Date(c.date);
      return (
        d.getFullYear().toString() === selectedYear &&
        String(d.getMonth() + 1).padStart(2, "0") === selectedMonth
      );
    });
  }

  // STATUS FILTER
  if (selectedStatus.length > 0) {
    list = list.filter((c: Contribution) => {
      const m = members.find((m: Member) => m.id === c.memberId);
      return m !== undefined && selectedStatus.includes(m.status);
    });
  }

  // CATEGORY FILTER
  if (selectedCategories.length > 0) {
    list = list.filter((c: Contribution) =>
      selectedCategories.includes(c.category)
    );
  }

  // CONTRIBUTION TYPE FILTER
  if (selectedContributionTypes.length > 0) {
    list = list.filter((c: Contribution) =>
      selectedContributionTypes.includes(c.contributionType)
    );
  }

  // AVAILABILITY
  const availableYears = useMemo<string[]>(() => {
    const years = new Set<string>();
    memberFiltered.forEach((c: Contribution) => {
      years.add(new Date(c.date).getFullYear().toString());
    });
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [memberFiltered]);

  const availableMonths = useMemo<string[]>(() => {
    if (!selectedYear) return [];
    const months = new Set<string>();
    memberFiltered.forEach((c: Contribution) => {
      const d = new Date(c.date);
      if (d.getFullYear().toString() === selectedYear) {
        months.add(String(d.getMonth() + 1).padStart(2, "0"));
      }
    });
    return [...months].sort();
  }, [memberFiltered, selectedYear]);

  return {
    filteredContributions: list,
    availableYears,
    availableMonths,
  };
}
