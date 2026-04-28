import { useContributionReport } from "./useContributionReport";
import type { ContributionBreakdown, ContributionBreakdownRow } from "./useContributionReport";
import { useAttendanceReport } from "./useAttendanceReport";
import { useMemberReport } from "./useMemberReport";
import { Member, Contribution } from "../lib/types";
import type { AttendanceRecord } from "../lib/types";

export type ReportRouterProps = {
  reportType: "members" | "contributions" | "attendance" | "setlists";

  // Shared
  members: Member[];
  selectedMembers: string[];
  selectedChurches: string[];
  selectedStatus: string[];

  // Contributions
  contributions: Contribution[];
  selectedCategories: string[];
  selectedContributionTypes: string[];
  contributionBreakdown: ContributionBreakdown;

  // Attendance
  attendance: AttendanceRecord[];
  includeVisitors: boolean;

  // Time frame
  timeFrame: "month" | "year";
  selectedYear: string | null;
  selectedMonth: string | null;
};

export type ReportFiltersResult = {
  availableYears: string[];
  availableMonths: string[];

  filteredMembers: Member[];
  filteredContributions: Contribution[];
  contributionBreakdownRows: ContributionBreakdownRow[];
  filteredAttendance: AttendanceRecord[];
};

export function useReportFilters(props: ReportRouterProps): ReportFiltersResult {
  const {
    reportType,
    contributions,
    attendance,
    members,
    includeVisitors,
    selectedMembers,
    selectedChurches,
    selectedStatus,
    selectedCategories,
    selectedContributionTypes,
    contributionBreakdown,
    timeFrame,
    selectedYear,
    selectedMonth,
  } = props;

  const contributionResult = useContributionReport({
    contributions,
    members,
    selectedMembers,
    selectedChurches,
    selectedStatus,
    selectedCategories,
    selectedContributionTypes,
    contributionBreakdown,
    timeFrame,
    selectedYear,
    selectedMonth,
  });

  const attendanceResult = useAttendanceReport({
    attendance,
    members,
    includeVisitors,
    selectedMembers,
    timeFrame,
    selectedYear,
    selectedMonth,
  });

  const memberResult = useMemberReport({
    members,
    selectedMembers,
    selectedStatus,
  });

  const availableYears =
    reportType === "contributions"
      ? contributionResult.availableYears
      : reportType === "attendance"
      ? attendanceResult.availableYears
      : [];

  const availableMonths =
    reportType === "contributions"
      ? contributionResult.availableMonths
      : reportType === "attendance"
      ? attendanceResult.availableMonths
      : [];

  const filteredMembers =
    reportType === "members" ? memberResult.filteredMembers : [];

  const filteredContributions =
    reportType === "contributions"
      ? contributionResult.filteredContributions
      : [];

  const contributionBreakdownRows =
    reportType === "contributions"
      ? contributionResult.breakdownRows
      : [];

  const filteredAttendance =
    reportType === "attendance"
      ? attendanceResult.filteredAttendance
      : [];

  return {
    availableYears,
    availableMonths,
    filteredMembers,
    filteredContributions,
    contributionBreakdownRows,
    filteredAttendance,
  };
}
