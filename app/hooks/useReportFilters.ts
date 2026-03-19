import { useContributionReport } from "./useContributionReport";
import { useAttendanceReport } from "./useAttendanceReport";
import { useMemberReport } from "./useMemberReport";
import { Member, Contribution } from "../lib/types";
import { AttendanceRecord } from "./useAttendanceForReports";

export type ReportRouterProps = {
  reportType: "members" | "contributions" | "attendance";

  // Shared
  members: Member[];
  selectedMembers: string[];
  selectedStatus: string[];

  // Contributions
  contributions: Contribution[];
  selectedCategories: string[];
  selectedContributionTypes: string[];

  // Attendance
  attendance: AttendanceRecord[];
  includeVisitors: boolean;

  // Time frame
  timeFrame: "week" | "month" | "year";
  selectedYear: string | null;
  selectedMonth: string | null;
  selectedWeek: number | null;
};

export type ReportFiltersResult = {
  availableYears: string[];
  availableMonths: string[];
  availableWeeks: number[];

  filteredMembers: Member[];
  filteredContributions: Contribution[];
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
    selectedStatus,
    selectedCategories,
    selectedContributionTypes,
    timeFrame,
    selectedYear,
    selectedMonth,
    selectedWeek,
  } = props;

  // ❗ All hooks are called unconditionally

  const contributionResult = useContributionReport({
    contributions,
    members,
    selectedMembers,
    selectedStatus,
    selectedCategories,
    selectedContributionTypes,
    timeFrame,
    selectedYear,
    selectedMonth,
    selectedWeek,
  });

  const attendanceResult = useAttendanceReport({
    attendance,
    members,
    includeVisitors,
    selectedMembers,
    timeFrame,
    selectedYear,
    selectedMonth,
    selectedWeek,
  });

  const memberResult = useMemberReport({
    members,
    selectedMembers,
    selectedStatus,
  });

  // Normalize to a single shape, switching only on data

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

  const availableWeeks =
    reportType === "contributions"
      ? contributionResult.availableWeeks
      : reportType === "attendance"
      ? attendanceResult.availableWeeks
      : [];

  const filteredMembers =
    reportType === "members" ? memberResult.filteredMembers : [];

  const filteredContributions =
    reportType === "contributions"
      ? contributionResult.filteredContributions
      : [];

  const filteredAttendance =
    reportType === "attendance"
      ? attendanceResult.filteredAttendance
      : [];

  return {
    availableYears,
    availableMonths,
    availableWeeks,
    filteredMembers,
    filteredContributions,
    filteredAttendance,
  };
}
