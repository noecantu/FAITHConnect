import { useMemo } from "react";
import { Contribution, Member } from "../lib/types";

export type ContributionBreakdown = "member" | "church" | "region" | "district";

export type ContributionBreakdownRow = {
  key: string;
  label: string;
  totalAmount: number;
  contributionCount: number;
  averageAmount: number;
};

export interface UseContributionReportProps {
  contributions: Contribution[];
  members: Member[];
  selectedMembers: string[];
  selectedChurches: string[];
  selectedStatus: string[];
  selectedCategories: string[];
  selectedContributionTypes: string[];
  timeFrame: "month" | "year";
  selectedYear: string | null;
  selectedMonth: string | null;
  contributionBreakdown: ContributionBreakdown;
}

export function useContributionReport({
  contributions,
  members,
  selectedMembers,
  selectedChurches,
  selectedStatus,
  selectedCategories,
  selectedContributionTypes,
  timeFrame,
  selectedYear,
  selectedMonth,
  contributionBreakdown,
}: UseContributionReportProps) {
  // MEMBER FILTER (robust)
  const memberFiltered = useMemo<Contribution[]>(() => {
    if (selectedMembers.length === 0) return contributions;

    return contributions.filter((c: Contribution) => {
      if (c.memberId && selectedMembers.includes(c.memberId)) return true;

      const normalizedName = (c.memberName ?? "").trim().toLowerCase();
      if (
        normalizedName &&
        selectedMembers.some(
          (token) => token.startsWith("name:") && token.slice(5).toLowerCase() === normalizedName
        )
      ) {
        return true;
      }

      const match = members.find((m: Member) => {
        const full = `${m.firstName} ${m.lastName}`.trim();
        return selectedMembers.includes(m.id) && c.memberName === full;
      });

      return Boolean(match);
    });
  }, [contributions, selectedMembers, members]);

  // CHURCH FILTER
  let list: Contribution[] =
    selectedChurches.length > 0
      ? memberFiltered.filter((c: Contribution) => {
          if (c.churchId && selectedChurches.includes(c.churchId)) return true;
          if (c.churchName && selectedChurches.includes(`name:${c.churchName}`)) return true;
          return false;
        })
      : memberFiltered;

  // DATE FILTERS

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

  const breakdownRows = useMemo<ContributionBreakdownRow[]>(() => {
    const grouped = new Map<string, { label: string; totalAmount: number; contributionCount: number }>();

    list.forEach((c: Contribution) => {
      const member = members.find((m: Member) => m.id === c.memberId);
      const memberName = member
        ? `${member.firstName} ${member.lastName}`.trim()
        : c.memberName ?? "Unknown Member";

      const label =
        contributionBreakdown === "district"
          ? c.districtName ?? "Unknown District"
          : contributionBreakdown === "region"
          ? c.regionName ?? "Unknown Region"
          : contributionBreakdown === "church"
          ? c.churchName ?? "Unknown Church"
          : memberName;

      const key = `${contributionBreakdown}:${label.toLowerCase()}`;
      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          label,
          totalAmount: c.amount,
          contributionCount: 1,
        });
        return;
      }

      existing.totalAmount += c.amount;
      existing.contributionCount += 1;
    });

    return [...grouped.entries()]
      .map(([key, value]) => ({
        key,
        label: value.label,
        totalAmount: value.totalAmount,
        contributionCount: value.contributionCount,
        averageAmount:
          value.contributionCount > 0
            ? value.totalAmount / value.contributionCount
            : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [list, members, contributionBreakdown]);

  return {
    filteredContributions: list,
    breakdownRows,
    availableYears,
    availableMonths,
  };
}
