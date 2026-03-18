'use client';

import { useMemo } from 'react';
import { Member, Contribution } from '../lib/types';
import { AttendanceRecord } from './useAttendanceForReports';
import { getISOWeek } from "date-fns";

interface UseReportFiltersProps {
  members: Member[];
  includeVisitors: boolean;
  contributions: Contribution[];
  attendance: AttendanceRecord[];
  selectedMembers: string[];
  selectedStatus: string[];
  selectedCategories: string[];
  selectedContributionTypes: string[];
  reportType: 'members' | 'contributions' | 'attendance';
  timeFrame: 'week' | 'month' | 'year';
  selectedYear: string | null;
  selectedMonth: string | null; // "01".."12"
  selectedWeek: number | null;
}

export function useReportFilters({
  members,
  includeVisitors,
  contributions,
  attendance,
  selectedMembers,
  selectedStatus,
  selectedCategories,
  selectedContributionTypes,
  reportType,
  timeFrame,
  selectedYear,
  selectedMonth,
  selectedWeek,
}: UseReportFiltersProps) {
  

  const memberFilteredContributions = useMemo(() => {
    if (selectedMembers.length === 0) return contributions;

    return contributions.filter((c) => {
      // Try to match by memberId
      if (c.memberId && selectedMembers.includes(c.memberId)) {
        return true;
      }

      // Try to match by memberName
      const match = members.find((m) => {
        const fullName = `${m.firstName} ${m.lastName}`.trim();
        return (
          selectedMembers.includes(m.id) &&
          c.memberName === fullName
        );
      });

      return Boolean(match);
    });
  }, [contributions, selectedMembers, members]);

  const hasData = memberFilteredContributions.length > 0;

  // -----------------------------
  // Fiscal Years
  // -----------------------------
  const availableYears = useMemo(() => {
    const source = hasData ? memberFilteredContributions : contributions;

    const years = new Set<string>();
    source.forEach(c => {
      years.add(new Date(c.date).getFullYear().toString());
    });

    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [hasData, memberFilteredContributions, contributions]);


  const availableMonths = useMemo(() => {
    if (!selectedYear) return [];

    const source = hasData ? memberFilteredContributions : contributions;

    const months = new Set<string>();
    source.forEach(c => {
      const d = new Date(c.date);
      if (d.getFullYear().toString() === selectedYear) {
        months.add(String(d.getMonth() + 1).padStart(2, "0"));
      }
    });

    return Array.from(months).sort();
  }, [hasData, selectedYear, memberFilteredContributions, contributions]);

  const availableWeeks = useMemo(() => {
    if (!selectedYear) return [];

    const source = hasData ? memberFilteredContributions : contributions;

    const weeks = new Set<number>();
    source.forEach(c => {
      const d = new Date(c.date);
      if (d.getFullYear().toString() === selectedYear) {
        weeks.add(getISOWeek(d));
      }
    });

    return Array.from(weeks).sort((a, b) => a - b);
  }, [hasData, selectedYear, memberFilteredContributions, contributions]);

  // -----------------------------
  // Members Filter
  // -----------------------------
  const filteredMembers = useMemo(() => {
    if (selectedMembers.length === 0) return [];

    let list = members;

    list = list.filter((m) => selectedMembers.includes(m.id));

    if (selectedStatus.length > 0) {
      list = list.filter((m) => selectedStatus.includes(m.status));
    }

    return list;
  }, [members, selectedMembers, selectedStatus]);

  // -----------------------------
  // Contributions Filter (GUIDED)
  // -----------------------------
  const filteredContributions = useMemo(() => {
    if (reportType !== "contributions") return [];
    if (selectedMembers.length === 0) return [];

    let list = memberFilteredContributions;

    //
    // YEAR FILTER
    //
    if (timeFrame === "year") {
      if (!selectedYear) return [];
      list = list.filter((c) => {
        const d = new Date(c.date);
        return d.getFullYear().toString() === selectedYear;
      });
    }

    //
    // MONTH FILTER
    //
    if (timeFrame === "month") {
      if (!selectedYear || !selectedMonth) return [];
      list = list.filter((c) => {
        const d = new Date(c.date);
        return (
          d.getFullYear().toString() === selectedYear &&
          String(d.getMonth() + 1).padStart(2, "0") === selectedMonth
        );
      });
    }

    //
    // WEEK FILTER
    //
    if (timeFrame === "week") {
      if (!selectedYear || !selectedWeek) return [];
      list = list.filter((c) => {
        const d = new Date(c.date);
        return (
          d.getFullYear().toString() === selectedYear &&
          getISOWeek(d) === selectedWeek
        );
      });
    }

    //
    // STATUS FILTER
    //
    if (selectedStatus.length > 0) {
      list = list.filter((c) => {
        const member = members.find((m) => m.id === c.memberId);
        return member && selectedStatus.includes(member.status);
      });
    }

    //
    // CATEGORY FILTER
    //
    if (selectedCategories.length > 0) {
      list = list.filter((c) => selectedCategories.includes(c.category));
    }

    //
    // CONTRIBUTION TYPE FILTER
    //
    if (selectedContributionTypes.length > 0) {
      list = list.filter((c) =>
        selectedContributionTypes.includes(c.contributionType)
      );
    }

    return list;
  }, [
    contributions,
    members,
    reportType,
    timeFrame,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedMembers,
    selectedStatus,
    selectedCategories,
    selectedContributionTypes,
  ]);

  // -----------------------------
  // Attendance Filter (GUIDED)
  // -----------------------------
  const filteredAttendance = useMemo(() => {
    if (reportType !== "attendance") return [];

    let list = attendance;

    //
    // YEAR FILTER
    //
    if (timeFrame === "year") {
      if (!selectedYear) return [];
      list = list.filter((a) => {
        const d = new Date(a.date);
        return d.getFullYear().toString() === selectedYear;
      });
    }

    //
    // MONTH FILTER
    //
    if (timeFrame === "month") {
      if (!selectedYear || !selectedMonth) return [];
      list = list.filter((a) => {
        const d = new Date(a.date);
        return (
          d.getFullYear().toString() === selectedYear &&
          String(d.getMonth() + 1).padStart(2, "0") === selectedMonth
        );
      });
    }

    //
    // WEEK FILTER
    //
    if (timeFrame === "week") {
      if (!selectedYear || !selectedWeek) return [];
      list = list.filter((a) => {
        const d = new Date(a.date);
        return (
          d.getFullYear().toString() === selectedYear &&
          getISOWeek(d) === selectedWeek
        );
      });
    }

    //
    // MEMBER FILTER
    //
    let memberRows: AttendanceRecord[] = [];

    if (selectedMembers.length > 0) {
      memberRows = list.filter(
        (a) => a.memberId && selectedMembers.includes(a.memberId)
      );
    } else {
      memberRows = [];
    }

    //
    // VISITOR FILTER
    //
    let visitorRows: AttendanceRecord[] = [];

    if (includeVisitors) {
      visitorRows = list.filter((a) => a.visitorId);
    }

    return [...memberRows, ...visitorRows];
  }, [
    attendance,
    reportType,
    timeFrame,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedMembers,
    includeVisitors,
  ]);

  return {
    availableYears,
    availableMonths,
    availableWeeks,
    filteredMembers,
    filteredContributions,
    filteredAttendance,
  };
}
