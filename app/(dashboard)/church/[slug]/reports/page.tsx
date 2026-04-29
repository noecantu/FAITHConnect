'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMembers } from "@/app/hooks/useMembers";
import { useContributions } from "@/app/hooks/use-contributions";
import { useScopedContributions } from "@/app/hooks/useScopedContributions";
import { useChurchId } from "@/app/hooks/useChurchId";
import { useAttendanceForReports } from "@/app/hooks/useAttendanceForReports";
import { useReportFilters } from "@/app/hooks/useReportFilters";
import { useReportExports } from "@/app/hooks/useReportExports";
import { useSetLists } from "@/app/hooks/useSetLists";
import { useServicePlans } from "@/app/hooks/useServicePlans";
import { useSongs } from "@/app/hooks/useSongs";
import type { ContributionBreakdown } from "@/app/hooks/useContributionReport";
import type { ServicePlan, SetList } from "@/app/lib/types";
import { PageHeader } from "@/app/components/page-header";
import { ReportFiltersPanel } from "@/app/components/reports/ReportFiltersPanel";
import { MemberPreviewTable } from "@/app/components/reports/MemberPreviewTable";
import { AttendancePreviewTable } from "@/app/components/reports/AttendancePreviewTable";
import { ContributionPreviewTable } from "@/app/components/reports/ContributionPreviewTable";
import { SetListPreviewReport } from "@/app/components/reports/SetListPreviewReport";
import { ServicePlanPreviewReport } from "@/app/components/reports/ServicePlanPreviewReport";
import { Button } from "@/app/components/ui/button";
import { FileText, Loader2, Sheet, Copy } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/app/hooks/use-toast";
import { formatCurrencyUSD } from "@/app/lib/formatters";

import { usePermissions } from "@/app/hooks/usePermissions";

export default function ReportsPage() {
  // -------------------------------------------------------
  // 1. ALL HOOKS MUST RUN FIRST (fixes hook-order errors)
  // -------------------------------------------------------
  const { members } = useMembers();
  const { contributions: churchContributions } = useContributions();
  const { churchId } = useChurchId();
  const { attendance } = useAttendanceForReports(churchId, members);
  const { toast } = useToast();

  const {
    loading: permissionsLoading,
    canReadReports,
    canReadMusic,
    canReadServicePlans,
    canReadMembersReports,
    canReadContributionsReports,
    canReadAttendanceReports,
    canReadSetListsReports,
    canReadServicePlansReports,
    isDistrictAdmin,
    isRegionalAdmin,
  } = usePermissions();

  const { lists: setLists, loading: setListsLoading } = useSetLists(churchId);
  const { plans: servicePlans, loading: servicePlansLoading } = useServicePlans(churchId);
  const { songs: servicePlanSongs, loading: servicePlanSongsLoading } = useSongs(churchId);

  const needsScopedContributions = isDistrictAdmin || isRegionalAdmin;
  const {
    contributions: scopedContributions,
    loading: scopedContributionsLoading,
  } = useScopedContributions({ enabled: needsScopedContributions });

  const contributions = needsScopedContributions
    ? scopedContributions
    : churchContributions;
  const scopedContributionOnly = needsScopedContributions;

  // -------------------------------------------------------
  // 2. LOCAL STATE HOOKS
  // -------------------------------------------------------
  const [reportType, setReportType] =
    useState<"none" | "members" | "contributions" | "attendance" | "setlists" | "serviceplans">("none");

  const [selectedSetListId, setSelectedSetListId] = useState<string | null>(null);
  const [selectedServicePlanId, setSelectedServicePlanId] = useState<string | null>(null);
  const [selectedSetListYear, setSelectedSetListYear] = useState<string | null>(null);
  const [selectedSetListMonth, setSelectedSetListMonth] = useState<string | null>(null);
  const [selectedServicePlanYear, setSelectedServicePlanYear] = useState<string | null>(null);
  const [selectedServicePlanMonth, setSelectedServicePlanMonth] = useState<string | null>(null);

  const [timeFrame, setTimeFrame] =
    useState<"month" | "year">("year");

  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedChurches, setSelectedChurches] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [contributionBreakdown, setContributionBreakdown] =
    useState<ContributionBreakdown>("member");
  const [includeVisitors, setIncludeVisitors] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isCopyingSetList, setIsCopyingSetList] = useState(false);

  const canAccessSetListReport = !needsScopedContributions && canReadSetListsReports;
  const canAccessServicePlanReport = !needsScopedContributions && canReadServicePlansReports;

  const setListYearOptions = useMemo(() => {
    const years = new Set<string>();
    setLists.forEach((list) => {
      years.add(String(new Date(list.dateTime).getFullYear()));
    });

    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [setLists]);

  const setListMonthOptions = useMemo(() => {
    if (!selectedSetListYear) return [];

    const months = new Set<string>();
    setLists.forEach((list) => {
      const date = new Date(list.dateTime);
      if (String(date.getFullYear()) !== selectedSetListYear) return;
      months.add(String(date.getMonth() + 1).padStart(2, "0"));
    });

    return [...months].sort((a, b) => Number(b) - Number(a));
  }, [setLists, selectedSetListYear]);

  const filteredSetLists = useMemo(() => {
    return setLists.filter((list) => {
      const date = new Date(list.dateTime);
      const year = String(date.getFullYear());
      const month = String(date.getMonth() + 1).padStart(2, "0");

      if (selectedSetListYear && year !== selectedSetListYear) return false;
      if (selectedSetListMonth && month !== selectedSetListMonth) return false;
      return true;
    });
  }, [setLists, selectedSetListYear, selectedSetListMonth]);

  const servicePlanYearOptions = useMemo(() => {
    const years = new Set<string>();
    servicePlans.forEach((plan) => {
      years.add(String(new Date(plan.dateTime).getFullYear()));
    });

    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [servicePlans]);

  const servicePlanMonthOptions = useMemo(() => {
    if (!selectedServicePlanYear) return [];

    const months = new Set<string>();
    servicePlans.forEach((plan) => {
      const date = new Date(plan.dateTime);
      if (String(date.getFullYear()) !== selectedServicePlanYear) return;
      months.add(String(date.getMonth() + 1).padStart(2, "0"));
    });

    return [...months].sort((a, b) => Number(b) - Number(a));
  }, [servicePlans, selectedServicePlanYear]);

  const filteredServicePlans = useMemo(() => {
    return servicePlans.filter((plan) => {
      const date = new Date(plan.dateTime);
      const year = String(date.getFullYear());
      const month = String(date.getMonth() + 1).padStart(2, "0");

      if (selectedServicePlanYear && year !== selectedServicePlanYear) return false;
      if (selectedServicePlanMonth && month !== selectedServicePlanMonth) return false;
      return true;
    });
  }, [servicePlans, selectedServicePlanYear, selectedServicePlanMonth]);

  useEffect(() => {
    if (setListYearOptions.length === 0) {
      setSelectedSetListYear(null);
      setSelectedSetListMonth(null);
      setSelectedSetListId(null);
      return;
    }

    if (selectedSetListYear && !setListYearOptions.includes(selectedSetListYear)) {
      setSelectedSetListYear(null);
      setSelectedSetListMonth(null);
    }
  }, [setListYearOptions, selectedSetListYear]);

  useEffect(() => {
    if (!selectedSetListYear) {
      setSelectedSetListMonth(null);
      return;
    }

    if (selectedSetListMonth && !setListMonthOptions.includes(selectedSetListMonth)) {
      setSelectedSetListMonth(null);
    }
  }, [selectedSetListYear, selectedSetListMonth, setListMonthOptions]);

  useEffect(() => {
    if (filteredSetLists.length === 0) {
      setSelectedSetListId(null);
      return;
    }

    if (selectedSetListId && !filteredSetLists.some((list) => list.id === selectedSetListId)) {
      setSelectedSetListId(null);
    }
  }, [filteredSetLists, selectedSetListId]);

  useEffect(() => {
    if (servicePlanYearOptions.length === 0) {
      setSelectedServicePlanYear(null);
      setSelectedServicePlanMonth(null);
      setSelectedServicePlanId(null);
      return;
    }

    if (selectedServicePlanYear && !servicePlanYearOptions.includes(selectedServicePlanYear)) {
      setSelectedServicePlanYear(null);
      setSelectedServicePlanMonth(null);
    }
  }, [servicePlanYearOptions, selectedServicePlanYear]);

  useEffect(() => {
    if (!selectedServicePlanYear) {
      setSelectedServicePlanMonth(null);
      return;
    }

    if (selectedServicePlanMonth && !servicePlanMonthOptions.includes(selectedServicePlanMonth)) {
      setSelectedServicePlanMonth(null);
    }
  }, [selectedServicePlanYear, selectedServicePlanMonth, servicePlanMonthOptions]);

  useEffect(() => {
    if (filteredServicePlans.length === 0) {
      setSelectedServicePlanId(null);
      return;
    }

    if (selectedServicePlanId && !filteredServicePlans.some((plan) => plan.id === selectedServicePlanId)) {
      setSelectedServicePlanId(null);
    }
  }, [filteredServicePlans, selectedServicePlanId]);

  const selectedSetList = useMemo<SetList | null>(() => {
    if (!selectedSetListId) return null;
    return setLists.find((list) => list.id === selectedSetListId) ?? null;
  }, [setLists, selectedSetListId]);

  const selectedServicePlan = useMemo<ServicePlan | null>(() => {
    if (!selectedServicePlanId) return null;
    return servicePlans.find((plan) => plan.id === selectedServicePlanId) ?? null;
  }, [servicePlans, selectedServicePlanId]);

  const setListOptions = useMemo(() => {
    return filteredSetLists.map((list) => ({
      value: list.id,
      label: `${list.title} • ${format(list.dateTime, "MMM d, yyyy h:mm a")}`,
    }));
  }, [filteredSetLists]);

  const servicePlanOptions = useMemo(() => {
    return filteredServicePlans.map((plan) => ({
      value: plan.id,
      label: `${plan.title} • ${format(plan.dateTime, "MMM d, yyyy h:mm a")}`,
    }));
  }, [filteredServicePlans]);

  const contributionBreakdownOptions = useMemo(() => {
    if (isDistrictAdmin) {
      return [
        { label: "District", value: "district" as const },
        { label: "Region", value: "region" as const },
        { label: "Church", value: "church" as const },
        { label: "Member", value: "member" as const },
      ];
    }

    if (isRegionalAdmin) {
      return [
        { label: "Region", value: "region" as const },
        { label: "Church", value: "church" as const },
        { label: "Member", value: "member" as const },
      ];
    }

    return [{ label: "Member", value: "member" as const }];
  }, [isDistrictAdmin, isRegionalAdmin]);

  useEffect(() => {
    const allowed = contributionBreakdownOptions.map((option) => option.value);
    if (!allowed.includes(contributionBreakdown)) {
      setContributionBreakdown(allowed[0]);
    }
  }, [contributionBreakdown, contributionBreakdownOptions]);

  const churchOptions = useMemo(() => {
    const map = new Map<string, { label: string; value: string }>();

    contributions.forEach((contribution) => {
      if (contribution.churchId && contribution.churchName) {
        map.set(contribution.churchId, {
          label: contribution.churchName,
          value: contribution.churchId,
        });
        return;
      }

      if (contribution.churchName) {
        const key = `name:${contribution.churchName}`;
        map.set(key, {
          label: contribution.churchName,
          value: key,
        });
      }
    });

    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [contributions]);

  const memberOptions = useMemo(() => {
    if (!needsScopedContributions) {
      return members
        .map((member) => ({
          label: `${member.firstName} ${member.lastName}`,
          value: member.id,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }

    const map = new Map<string, { label: string; value: string }>();

    contributions.forEach((contribution) => {
      const name = (contribution.memberName ?? "").trim();
      if (!name) return;

      map.set(`name:${name}`, {
        label: name,
        value: `name:${name}`,
      });
    });

    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [needsScopedContributions, members, contributions]);

  const selectedChurchLabels = useMemo(() => {
    if (selectedChurches.length === 0) {
      return churchOptions.map((option) => option.label);
    }

    const map = new Map(churchOptions.map((option) => [option.value, option.label]));
    return selectedChurches
      .map((value) => map.get(value))
      .filter((label): label is string => Boolean(label));
  }, [selectedChurches, churchOptions]);

  const selectedMemberLabels = useMemo(() => {
    if (selectedMembers.length === 0) return [];

    const map = new Map(memberOptions.map((option) => [option.value, option.label]));
    return selectedMembers
      .map((value) => map.get(value))
      .filter((label): label is string => Boolean(label));
  }, [selectedMembers, memberOptions]);

  // -------------------------------------------------------
  // 4. FILTERING LOGIC HOOK
  // -------------------------------------------------------
  const {
    availableYears,
    availableMonths,
    filteredMembers,
    filteredContributions,
    contributionBreakdownRows,
    filteredAttendance,
  } = useReportFilters({
    members,
    includeVisitors,
    contributions,
    attendance,
    selectedMembers,
    selectedChurches,
    selectedStatus,
    selectedCategories: [],
    selectedContributionTypes: [],
    contributionBreakdown,
    reportType,
    timeFrame,
    selectedYear,
    selectedMonth,
    // selectedWeek,
  });

  // Require an explicit selection before showing report data.
  const hasMembersSelection = selectedMembers.length > 0 || selectedStatus.length > 0;
  const hasContributionsSelection =
    timeFrame === "month"
      ? selectedYear !== null && selectedMonth !== null
      : selectedYear !== null;
  const hasAttendanceSelection =
    selectedYear !== null ||
    selectedMonth !== null ||
    selectedMembers.length > 0;
  const hasSetListSelection = selectedSetListYear !== null && !!selectedSetListId;
  const hasServicePlanSelection = selectedServicePlanYear !== null && !!selectedServicePlanId;

  const effectiveFilteredMembers = hasMembersSelection ? filteredMembers : [];
  const effectiveFilteredContributions = hasContributionsSelection ? filteredContributions : [];
  const effectiveContributionBreakdownRows = hasContributionsSelection ? contributionBreakdownRows : [];
  const effectiveFilteredAttendance = hasAttendanceSelection ? filteredAttendance : [];

  const contributionTotalAmount = useMemo(() => {
    return effectiveFilteredContributions.reduce((sum, contribution) => sum + contribution.amount, 0);
  }, [effectiveFilteredContributions]);

  const monthLabelForYearMonth = (year: string, month: string) =>
    new Date(Number(year), Number(month) - 1, 1).toLocaleString("default", {
      month: "long",
    });

  const reportSubtitle = useMemo(() => {
    if (reportType === "contributions") {
      const periodLabel =
        timeFrame === "month"
          ? selectedYear && selectedMonth
            ? `${monthLabelForYearMonth(selectedYear, selectedMonth)} ${selectedYear}`
            : "All Months"
          : selectedYear
          ? `Year ${selectedYear}`
          : "All Years";

      const churchLabel =
        needsScopedContributions
          ? selectedChurches.length > 0
            ? `${selectedChurches.length} church${selectedChurches.length === 1 ? "" : "es"}`
            : "All churches"
          : "Current church";

      const memberLabel =
        selectedMembers.length > 0
          ? `${selectedMembers.length} member${selectedMembers.length === 1 ? "" : "s"}`
          : "All members";

      return `Contributions • ${periodLabel} • ${churchLabel} • ${memberLabel}`;
    }

    if (reportType === "attendance") {
      const periodLabel =
        timeFrame === "month"
          ? selectedYear && selectedMonth
            ? `${monthLabelForYearMonth(selectedYear, selectedMonth)} ${selectedYear}`
            : "All Months"
          : selectedYear
          ? `Year ${selectedYear}`
          : "All Years";

      return `Attendance • ${periodLabel}`;
    }

    if (reportType === "setlists") {
      if (!selectedSetList) {
        return "Set Lists • Select a set list to preview.";
      }

      return `Set Lists • ${selectedSetList.title} • ${format(
        selectedSetList.dateTime,
        "MMM d, yyyy h:mm a"
      )}`;
    }

    if (reportType === "serviceplans") {
      if (!selectedServicePlan) {
        return "Service Plans • Select a service plan to preview.";
      }

      return `Service Plans • ${selectedServicePlan.title} • ${format(
        selectedServicePlan.dateTime,
        "MMM d, yyyy h:mm a"
      )}`;
    }

    if (reportType === "none") {
      return "Choose a report type to get started.";
    }

    return "Members • Filter and export your directory data.";
  }, [
    reportType,
    timeFrame,
    selectedYear,
    selectedMonth,
    needsScopedContributions,
    selectedChurches.length,
    selectedMembers.length,
    selectedSetList,
    selectedServicePlan,
  ]);

  const contributionExportContext = useMemo(() => {
    const timeframe =
      timeFrame === "month"
        ? selectedYear && selectedMonth
          ? `${monthLabelForYearMonth(selectedYear, selectedMonth)} ${selectedYear}`
          : "All Months"
        : selectedYear
        ? selectedYear
        : "All Years";

    return {
      contextLines: [`Timeframe: ${timeframe}`],
    };
  }, [
    timeFrame,
    selectedYear,
    selectedMonth,
  ]);

  const setListShareText = useMemo(() => {
    if (!selectedSetList) return "";

    const lines: string[] = [];
    lines.push(`Set List: ${selectedSetList.title}`);
    lines.push(`When: ${format(selectedSetList.dateTime, "EEEE, MMM d, yyyy h:mm a")}`);

    if (selectedSetList.serviceType) {
      lines.push(`Service Type: ${selectedSetList.serviceType}`);
    }
    if (selectedSetList.serviceNotes?.theme) {
      lines.push(`Theme: ${selectedSetList.serviceNotes.theme}`);
    }
    if (selectedSetList.serviceNotes?.scripture) {
      lines.push(`Scripture: ${selectedSetList.serviceNotes.scripture}`);
    }

    lines.push("");
    lines.push("Sections:");

    selectedSetList.sections.forEach((section) => {
      lines.push(`- ${section.title}`);

      if (section.songs.length === 0) {
        lines.push("  (No songs)");
        return;
      }

      section.songs.forEach((song, index) => {
        const details = [
          song.key ? `Key ${song.key}` : null,
          song.bpm != null ? `${song.bpm} BPM` : null,
          song.timeSignature ? `${song.timeSignature} Time` : null,
        ].filter((part): part is string => Boolean(part));

        lines.push(`  ${index + 1}. ${song.title}${details.length ? ` (${details.join(" | ")})` : ""}`);

        if (song.notes) {
          lines.push(`     Notes: ${song.notes}`);
        }
      });
    });

    if (selectedSetList.serviceNotes?.notes) {
      lines.push("");
      lines.push(`Service Notes: ${selectedSetList.serviceNotes.notes}`);
    }

    return lines.join("\n");
  }, [selectedSetList]);

  const servicePlanShareText = useMemo(() => {
    if (!selectedServicePlan) return "";

    const lines: string[] = [];
    lines.push(`Service Plan: ${selectedServicePlan.title}`);
    lines.push(`When: ${format(selectedServicePlan.dateTime, "EEEE, MMM d, yyyy h:mm a")}`);

    if (selectedServicePlan.notes.trim().length > 0) {
      lines.push(`Service Notes: ${selectedServicePlan.notes}`);
    }

    lines.push("");
    lines.push("Sections:");

    selectedServicePlan.sections.forEach((section) => {
      lines.push(`- ${section.title}`);

      if (section.personId) {
        const member = members.find((m) => m.id === section.personId);
        lines.push(`  Person: ${member ? `${member.firstName} ${member.lastName}` : "Unknown Member"}`);
      }

      if (section.songIds.length === 0) {
        lines.push("  Music: No songs");
      } else {
        lines.push("  Music:");
        section.songIds.forEach((songId, index) => {
          const song = servicePlanSongs.find((s) => s.id === songId);
          lines.push(`    ${index + 1}. ${song ? song.title : "Unknown Song"}`);
        });
      }

      if (section.notes.trim().length > 0) {
        lines.push(`  Notes: ${section.notes}`);
      }
    });

    return lines.join("\n");
  }, [selectedServicePlan, members, servicePlanSongs]);

  // -------------------------------------------------------
  // 5. EXPORT LOGIC HOOK
  // -------------------------------------------------------
  const { exportPDF, exportExcel } = useReportExports({
    reportType,
    filteredMembers: effectiveFilteredMembers,
    filteredContributions: effectiveFilteredContributions,
    filteredAttendance: effectiveFilteredAttendance,
    selectedFields,
    members,
    selectedSetList,
    selectedServicePlan,
    servicePlanSongs,
    contributionExportContext,
    contributionUseGroupedView: scopedContributionOnly,
    contributionBreakdownRows: effectiveContributionBreakdownRows,
    contributionBreakdown,
  });

  // -------------------------------------------------------
  // 6. SAFE REPORT TYPE SWITCHING
  // -------------------------------------------------------
  const safeSetReportType = (
    type: "none" | "members" | "contributions" | "attendance" | "setlists" | "serviceplans"
  ) => {
    if (type === "none") {
      setReportType("none");
      return;
    }
    if (scopedContributionOnly && type !== "contributions") return;
    if (type === "members" && !canReadMembersReports) return;
    if (type === "contributions" && !canReadContributionsReports) return;
    if (type === "attendance" && !canReadAttendanceReports) return;
    if (type === "setlists" && !canAccessSetListReport) return;
    if (type === "serviceplans" && !canAccessServicePlanReport) return;
    setReportType(type);
  };

  const handleCopyPlanText = async () => {
    const textToCopy =
      reportType === "setlists"
        ? setListShareText
        : reportType === "serviceplans"
        ? servicePlanShareText
        : "";

    if (!textToCopy) return;

    try {
      setIsCopyingSetList(true);
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: reportType === "serviceplans" ? "Service plan copied" : "Set list copied",
        description: "Share text copied to clipboard.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard. Please try again.",
      });
    } finally {
      setIsCopyingSetList(false);
    }
  };

  const resetFilters = () => {
    setSelectedMembers([]);
    setSelectedChurches([]);
    setSelectedStatus([]);
    setSelectedFields([]);
    setIncludeVisitors(false);
    setTimeFrame("year");
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedSetListYear(null);
    setSelectedSetListMonth(null);
    setSelectedSetListId(null);
    setSelectedServicePlanYear(null);
    setSelectedServicePlanMonth(null);
    setSelectedServicePlanId(null);
  };

  // -------------------------------------------------------
  // 7. AUTO-SELECT YEAR/MONTH/WEEK
  // -------------------------------------------------------
  useEffect(() => {
    if (selectedYear && !availableYears.includes(selectedYear)) {
      setSelectedYear(null);
      setSelectedMonth(null);
    }
  }, [selectedYear, availableYears]);

  useEffect(() => {
    if (selectedMonth && !availableMonths.includes(selectedMonth)) {
      setSelectedMonth(null);
    }
  }, [selectedMonth, availableMonths]);

  // -------------------------------------------------------
  // 8. EXPORT BUTTON VISIBILITY
  // -------------------------------------------------------
  const canExport =
    (reportType === "members" && canReadMembersReports && hasMembersSelection) ||
    (reportType === "contributions" && canReadContributionsReports && hasContributionsSelection) ||
    (reportType === "attendance" && canReadAttendanceReports && hasAttendanceSelection) ||
    (reportType === "setlists" && canAccessSetListReport && hasSetListSelection && !!selectedSetList) ||
    (reportType === "serviceplans" && canAccessServicePlanReport && hasServicePlanSelection && !!selectedServicePlan);

  const canCopyPlan =
    (reportType === "setlists" && canAccessSetListReport && !!selectedSetList) ||
    (reportType === "serviceplans" && canAccessServicePlanReport && !!selectedServicePlan);

  const canReadAnyReport =
    canReadReports ||
    canReadMembersReports ||
    canReadContributionsReports ||
    canReadAttendanceReports ||
    canAccessSetListReport ||
    canAccessServicePlanReport;

  // -------------------------------------------------------
  // 9. EARLY PERMISSION GATE (AFTER ALL HOOKS)
  // -------------------------------------------------------
  if (
    permissionsLoading ||
    scopedContributionsLoading ||
    (reportType === "setlists" && setListsLoading) ||
    (reportType === "serviceplans" && (servicePlansLoading || servicePlanSongsLoading)) ||
    (!churchId && !needsScopedContributions)
  ) {
    return (
      <>
        <PageHeader title="Reports" />
        <p className="text-muted-foreground">Loading reports…</p>
      </>
    );
  }

  if (!canReadAnyReport) {
    return (
      <>
        <PageHeader title="Reports" />
        <p className="text-muted-foreground">
          You do not have permission to view reports.
        </p>
      </>
    );
  }

  // -------------------------------------------------------
  // 10. RENDER PAGE
  // -------------------------------------------------------
  return (
    <>
      <PageHeader
        title="Reports"
        // subtitle={reportSubtitle}
      >
        {canExport && (
          <div className="flex items-center gap-2">
            {canCopyPlan && (
              <Button
                onClick={handleCopyPlanText}
                size="sm"
                variant="outline"
                className="bg-black/80 border border-white/20 backdrop-blur-xl"
                disabled={isCopyingSetList || isExportingPDF || isExportingExcel}
              >
                {isCopyingSetList ? "Copying..." : "Copy Text"}
                <Copy className="h-5 w-5" />
              </Button>
            )}

            <Button
              onClick={async () => {
                setIsExportingPDF(true);
                await exportPDF();
                setIsExportingPDF(false);
              }}
              size="sm"
              variant="outline"
              className="bg-black/80 border border-white/20 backdrop-blur-xl"
              disabled={isExportingPDF || isExportingExcel}
            >
              {isExportingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  PDF
                </>
              ) : (
                "PDF"
              )}
              <FileText className="h-5 w-5" />
            </Button>

            <Button
              onClick={async () => {
                setIsExportingExcel(true);
                await exportExcel();
                setIsExportingExcel(false);
              }}
              size="sm"
              variant="outline"
              className="bg-black/80 border border-white/20 backdrop-blur-xl"
              disabled={isExportingPDF || isExportingExcel}
            >
              {isExportingExcel ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excel
                </>
              ) : (
                "Excel"
              )}
              <Sheet className="h-5 w-5" />
            </Button>
          </div>
        )}
      </PageHeader>

      <div className="flex flex-col items-start gap-6 lg:flex-row xl:gap-8">
        {/* LEFT PANEL */}
        <ReportFiltersPanel
          reportType={reportType}
          setReportType={safeSetReportType}
          setListOptions={setListOptions}
          setListYearOptions={setListYearOptions}
          selectedSetListYear={selectedSetListYear}
          setSelectedSetListYear={setSelectedSetListYear}
          setListMonthOptions={setListMonthOptions}
          selectedSetListMonth={selectedSetListMonth}
          setSelectedSetListMonth={setSelectedSetListMonth}
          selectedSetListId={selectedSetListId}
          setSelectedSetListId={setSelectedSetListId}
          servicePlanOptions={servicePlanOptions}
          servicePlanYearOptions={servicePlanYearOptions}
          selectedServicePlanYear={selectedServicePlanYear}
          setSelectedServicePlanYear={setSelectedServicePlanYear}
          servicePlanMonthOptions={servicePlanMonthOptions}
          selectedServicePlanMonth={selectedServicePlanMonth}
          setSelectedServicePlanMonth={setSelectedServicePlanMonth}
          selectedServicePlanId={selectedServicePlanId}
          setSelectedServicePlanId={setSelectedServicePlanId}
          members={members}
          memberOptions={memberOptions}
          selectedMembers={selectedMembers}
          setSelectedMembers={setSelectedMembers}
          selectedChurches={selectedChurches}
          setSelectedChurches={setSelectedChurches}
          churchOptions={churchOptions}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          contributionBreakdown={contributionBreakdown}
          setContributionBreakdown={setContributionBreakdown}
          contributionBreakdownOptions={contributionBreakdownOptions}
          selectedFields={selectedFields}
          setSelectedFields={setSelectedFields}
          includeVisitors={includeVisitors}
          setIncludeVisitors={setIncludeVisitors}
          timeFrame={timeFrame}
          setTimeFrame={setTimeFrame}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          availableYears={availableYears}
          availableMonths={availableMonths}
          canReadMembers={!scopedContributionOnly && canReadMembersReports}
          canReadContributions={canReadContributionsReports}
          canReadAttendance={!scopedContributionOnly && canReadAttendanceReports}
          canReadSetLists={canAccessSetListReport}
          canReadServicePlans={canAccessServicePlanReport}
          onResetFilters={resetFilters}
        />

        {/* RIGHT PANEL */}
        <div className="animate-fadeIn w-full min-w-0 space-y-6">
          {reportType === "none" && (
            <div className="rounded-md border border-white/20 bg-black/30 p-4 text-sm text-muted-foreground">
              Select a report type on the left to begin.
            </div>
          )}

          {reportType === "contributions" && scopedContributionOnly && canReadContributionsReports && hasContributionsSelection && (
            <div className="rounded-md border border-white/20 bg-black/50 p-4 text-sm text-white/90 backdrop-blur-xl">
              <div className="font-semibold mb-2">Report Scope Summary</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-white/80">
                <div>
                  Scope: {needsScopedContributions ? (isDistrictAdmin ? "District" : "Region") : "Church"}
                </div>
                <div>
                  Breakdown: {contributionBreakdown.charAt(0).toUpperCase() + contributionBreakdown.slice(1)}
                </div>
                <div>
                  Churches: {selectedChurchLabels.length > 0 ? selectedChurchLabels.length : "All"}
                </div>
                <div>
                  Members: {selectedMemberLabels.length > 0 ? selectedMemberLabels.length : "All"}
                </div>
                <div>
                  Rows: {effectiveContributionBreakdownRows.length}
                </div>
                <div>
                  Total: {formatCurrencyUSD(contributionTotalAmount)}
                </div>
              </div>
            </div>
          )}

          {reportType === "attendance" && !scopedContributionOnly && canReadAttendanceReports && hasAttendanceSelection && (
            <AttendancePreviewTable
              attendance={effectiveFilteredAttendance}
              members={members}
            />
          )}

          {reportType === "attendance" && !scopedContributionOnly && canReadAttendanceReports && !hasAttendanceSelection && (
            <div className="rounded-md border border-white/20 bg-black/30 p-4 text-sm text-muted-foreground">
              Select at least one filter (Year, Month, or Member) to view attendance data.
            </div>
          )}

          {reportType === "contributions" && canReadContributionsReports && hasContributionsSelection && (
            <>
              {effectiveFilteredContributions.length === 0 && (
                <div className="rounded-md border border-white/20 bg-black/30 p-4 text-sm text-muted-foreground">
                  No contribution records match the current filters. Try widening Churches, Members, or Date filters.
                </div>
              )}

              <ContributionPreviewTable
                contributions={effectiveFilteredContributions}
                members={members}
                selectedFields={[]}
                breakdown={contributionBreakdown}
                breakdownRows={effectiveContributionBreakdownRows}
                useGroupedView={scopedContributionOnly}
              />
            </>
          )}

          {reportType === "contributions" && canReadContributionsReports && !hasContributionsSelection && (
            <div className="rounded-md border border-white/20 bg-black/30 p-4 text-sm text-muted-foreground">
              {timeFrame === "month"
                ? "Select both Year and Month to view contribution data."
                : "Select a Year to view contribution data."}
            </div>
          )}

          {reportType === "members" && !scopedContributionOnly && canReadMembersReports && hasMembersSelection && (
            <MemberPreviewTable
              members={effectiveFilteredMembers}
              selectedFields={selectedFields}
            />
          )}

          {reportType === "members" && !scopedContributionOnly && canReadMembersReports && !hasMembersSelection && (
            <div className="rounded-md border border-white/20 bg-black/30 p-4 text-sm text-muted-foreground">
              Select at least one filter (Member or Status) to view member data.
            </div>
          )}

          {reportType === "setlists" && canAccessSetListReport && hasSetListSelection && (
            <SetListPreviewReport setList={selectedSetList} />
          )}

          {reportType === "setlists" && canAccessSetListReport && !hasSetListSelection && (
            <div className="rounded-md border border-white/20 bg-black/30 p-4 text-sm text-muted-foreground">
              {!selectedSetListYear
                ? "Select a Set List Year first, then choose a set list to view report data."
                : "Select a set list to view report data."}
            </div>
          )}

          {reportType === "serviceplans" && canAccessServicePlanReport && hasServicePlanSelection && (
            <ServicePlanPreviewReport
              plan={selectedServicePlan}
              members={members}
              songs={servicePlanSongs}
            />
          )}

          {reportType === "serviceplans" && canAccessServicePlanReport && !hasServicePlanSelection && (
            <div className="rounded-md border border-white/20 bg-black/30 p-4 text-sm text-muted-foreground">
              {!selectedServicePlanYear
                ? "Select a Service Plan Year first, then choose a service plan to view report data."
                : "Select a service plan to view report data."}
            </div>
          )}
        </div>
      </div>
    </>
  );
}