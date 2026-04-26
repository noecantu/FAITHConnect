import { useMemo } from "react";
import { getISOWeek } from "date-fns";
import { AttendanceRecord, Member } from "../lib/types";

export interface UseAttendanceReportProps {
  attendance: AttendanceRecord[];
  members: Member[];
  includeVisitors: boolean;
  selectedMembers: string[];
  timeFrame: "month" | "year";
  selectedYear: string | null;
  selectedMonth: string | null;
}

export function useAttendanceReport({
  attendance,
  members,
  includeVisitors,
  selectedMembers,
  timeFrame,
  selectedYear,
  selectedMonth,
}: UseAttendanceReportProps) {
  const safeAttendance = Array.isArray(attendance) ? attendance : [];
  const safeMembers = Array.isArray(members) ? members : [];
  const safeSelectedMembers = Array.isArray(selectedMembers) ? selectedMembers : [];

  // MEMBER FILTER (robust)
  const memberFiltered = useMemo<AttendanceRecord[]>(() => {
    if (safeSelectedMembers.length === 0) return safeAttendance;

    return safeAttendance.filter((a: AttendanceRecord) => {
      if (a.memberId && safeSelectedMembers.includes(a.memberId)) return true;

      const match = safeMembers.find((m: Member) => {
        const full = `${m.firstName} ${m.lastName}`.trim();
        return safeSelectedMembers.includes(m.id) && a.memberName === full;
      });

      return Boolean(match);
    });
  }, [safeAttendance, safeSelectedMembers, safeMembers]);

  // DATE FILTERS
  let list: AttendanceRecord[] = memberFiltered;

  if (timeFrame === "year" && selectedYear) {
    list = list.filter((a: AttendanceRecord) => {
      const d = new Date(a.date);
      return d.getFullYear().toString() === selectedYear;
    });
  }

  if (timeFrame === "month" && selectedYear && selectedMonth) {
    list = list.filter((a: AttendanceRecord) => {
      const d = new Date(a.date);
      return (
        d.getFullYear().toString() === selectedYear &&
        String(d.getMonth() + 1).padStart(2, "0") === selectedMonth
      );
    });
  }

  // VISITORS
  let visitorRows: AttendanceRecord[] = [];
  if (includeVisitors) {
    visitorRows = safeAttendance.filter((a: AttendanceRecord) => {
      if (!a.visitorId) return false;
      const d = new Date(a.date);

      if (timeFrame === "year" && selectedYear) {
        if (d.getFullYear().toString() !== selectedYear) return false;
      }

      if (timeFrame === "month" && selectedYear && selectedMonth) {
        if (
          d.getFullYear().toString() !== selectedYear ||
          String(d.getMonth() + 1).padStart(2, "0") !== selectedMonth
        ) {
          return false;
        }
      }

      return true;
    });
  }

  // AVAILABILITY
  const availableYears = useMemo<string[]>(() => {
    const years = new Set<string>();
    memberFiltered.forEach((a: AttendanceRecord) => {
      years.add(new Date(a.date).getFullYear().toString());
    });
    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [memberFiltered]);

  const availableMonths = useMemo<string[]>(() => {
    if (!selectedYear) return [];
    const months = new Set<string>();
    memberFiltered.forEach((a: AttendanceRecord) => {
      const d = new Date(a.date);
      if (d.getFullYear().toString() === selectedYear) {
        months.add(String(d.getMonth() + 1).padStart(2, "0"));
      }
    });
    return [...months].sort();
  }, [memberFiltered, selectedYear]);

  const availableWeeks = useMemo<number[]>(() => {
    if (!selectedYear) return [];
    const weeks = new Set<number>();
    memberFiltered.forEach((a: AttendanceRecord) => {
      const d = new Date(a.date);
      if (d.getFullYear().toString() === selectedYear) {
        weeks.add(getISOWeek(d));
      }
    });
    return [...weeks].sort((a, b) => a - b);
  }, [memberFiltered, selectedYear]);

  return {
    filteredAttendance: [...list, ...visitorRows],
    availableYears,
    availableMonths,
    availableWeeks,
  };
}
