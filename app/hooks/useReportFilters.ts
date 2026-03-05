'use client';

import { useMemo } from 'react';
import { Member, Contribution } from '../lib/types';
import { AttendanceRecord } from './useAttendanceForReports';

interface UseReportFiltersProps {
  members: Member[];
  contributions: Contribution[];
  attendance: AttendanceRecord[];

  selectedMembers: string[];
  selectedStatus: string[];
  selectedFY: string[];
  selectedCategories: string[];
  selectedContributionTypes: string[];

  reportRange: 'week' | 'month' | 'year';
  reportType: 'members' | 'contributions' | 'attendance';

  selectedDate?: string | null;
}

export function useReportFilters({
  members,
  contributions,
  attendance,
  selectedMembers,
  selectedStatus,
  selectedFY,
  selectedCategories,
  selectedContributionTypes,
  reportRange,
  reportType,
  selectedDate,
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
    if (reportType !== "contributions") return [];
    if (selectedMembers.length === 0) return [];
    if (selectedFY.length === 0) return [];

    let list = contributions;

    // Year filter
    list = list.filter((c) =>
      selectedFY.includes(new Date(c.date).getFullYear().toString())
    );

    // Apply range filter (week, month)
    const now = new Date();

    if (reportRange === "month") {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      list = list.filter((c) => {
        const d = new Date(c.date);
        return (
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        );
      });
    }

    if (reportRange === "week") {
      list = list.filter((c) => {
        const d = new Date(c.date);
        const diffDays = (now.getTime() - d.getTime()) / 86400000;
        return diffDays <= 7;
      });
    }

    // Member filter
    list = list.filter(
      (c) => c.memberId && selectedMembers.includes(c.memberId)
    );

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
    reportRange,
    reportType,
  ]);

    /**
     * Filtered Attendance
     */
    const filteredAttendance = useMemo(() => {
      if (reportType !== "attendance") return [];
      if (selectedMembers.length === 0) return [];

      let list = attendance;

      // Specific date filter
      if (selectedDate) {
        list = list.filter(a => a.date.startsWith(selectedDate));
      }

      // Range filters only apply when no specific date is selected
      if (!selectedDate) {
        const now = new Date();

        if (reportRange === "month") {
          const m = now.getMonth();
          const y = now.getFullYear();
          list = list.filter((a) => {
            const d = new Date(a.date);
            return d.getMonth() === m && d.getFullYear() === y;
          });
        }

        if (reportRange === "week") {
          list = list.filter((a) => {
            const d = new Date(a.date);
            const diff = (now.getTime() - d.getTime()) / 86400000;
            return diff <= 7;
          });
        }
      }

      // Member filter
      list = list.filter((a) => a.memberId && selectedMembers.includes(a.memberId));

      return list;
    }, [attendance, reportType, reportRange, selectedMembers, selectedDate]);

  return {
    availableYears,
    filteredMembers,
    filteredContributions,
    filteredAttendance,
  };
}
