'use client';

import { useMemo } from 'react';
import { Member, Contribution } from '../lib/types';
import { AttendanceRecord } from './useAttendanceForReports';

interface UseReportFiltersProps {
  members: Member[];
  includeVisitors: boolean;
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
  includeVisitors,
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

  // -----------------------------
  // Fiscal Years
  // -----------------------------
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    contributions.forEach((c) => {
      years.add(new Date(c.date).getFullYear().toString());
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [contributions]);

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
  // Contributions Filter
  // -----------------------------
  const filteredContributions = useMemo(() => {
    if (reportType !== "contributions") return [];
    if (selectedMembers.length === 0) return [];
    if (selectedFY.length === 0) return [];

    let list = contributions;

    list = list.filter((c) =>
      selectedFY.includes(new Date(c.date).getFullYear().toString())
    );

    const now = new Date();

    if (reportRange === "month") {
      const m = now.getMonth();
      const y = now.getFullYear();
      list = list.filter((c) => {
        const d = new Date(c.date);
        return d.getMonth() === m && d.getFullYear() === y;
      });
    }

    if (reportRange === "week") {
      list = list.filter((c) => {
        const d = new Date(c.date);
        const diff = (now.getTime() - d.getTime()) / 86400000;
        return diff <= 7;
      });
    }

    list = list.filter(
      (c) => c.memberId && selectedMembers.includes(c.memberId)
    );

    if (selectedStatus.length > 0) {
      list = list.filter((c) => {
        const member = members.find((m) => m.id === c.memberId);
        return member && selectedStatus.includes(member.status);
      });
    }

    if (selectedCategories.length > 0) {
      list = list.filter((c) => selectedCategories.includes(c.category));
    }

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

  // -----------------------------
  // Attendance Filter (UPDATED)
  // -----------------------------
  const filteredAttendance = useMemo(() => {
    if (reportType !== "attendance") return [];

    let list = attendance;

    // Date filter
    if (selectedDate) {
      list = list.filter((a) => a.date.startsWith(selectedDate));
    }

    // Range filters
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

    // -----------------------------
    // MEMBER ROWS (UPDATED)
    // -----------------------------
    let memberRows: AttendanceRecord[] = [];

    if (selectedMembers.length > 0) {
      // Only selected members
      memberRows = list.filter(
        (a) => a.memberId && selectedMembers.includes(a.memberId)
      );
    } else {
      // No members selected → show NO members
      memberRows = [];
    }

    // -----------------------------
    // VISITOR ROWS (unchanged)
    // -----------------------------
    let visitorRows: AttendanceRecord[] = [];

    if (includeVisitors) {
      visitorRows = list.filter((a) => a.visitorId);
    }

    return [...memberRows, ...visitorRows];
  }, [
    attendance,
    reportType,
    reportRange,
    selectedMembers,
    selectedDate,
    includeVisitors,
  ]);

  return {
    availableYears,
    filteredMembers,
    filteredContributions,
    filteredAttendance,
  };
}
