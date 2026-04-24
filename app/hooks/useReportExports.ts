'use client';

import { useCallback, useMemo } from 'react';
import { Member, Contribution, AttendanceRecord } from '@/app/lib/types';
import type {
  ContributionBreakdown,
  ContributionBreakdownRow,
} from '@/app/hooks/useContributionReport';

import {
  generateMembersPDF,
  generateMembersExcel,
  generateContributionsPDF,
  generateContributionsExcel,
  generateAttendancePDF,
  generateAttendanceExcel,
} from '@/app/lib/reports';

import {
  mapToContributionRows,
  reduceContributionRowsForExport,
} from '@/app/lib/reportMapping/contributionRows';

interface UseReportExportsProps {
  reportType: 'members' | 'contributions' | 'attendance';
  filteredMembers: Member[];
  filteredContributions: Contribution[];
  filteredAttendance: AttendanceRecord[];
  selectedFields: string[];
  members: Member[];
  contributionExportContext?: {
    contextLines: string[];
    fieldLabelOverrides?: Record<string, string>;
  };
  contributionUseGroupedView?: boolean;
  contributionBreakdownRows?: ContributionBreakdownRow[];
  contributionBreakdown?: ContributionBreakdown;
}

export function useReportExports({
  reportType,
  filteredMembers,
  filteredContributions,
  filteredAttendance,
  selectedFields,
  members,
  contributionExportContext,
  contributionUseGroupedView = false,
  contributionBreakdownRows = [],
  contributionBreakdown = "member",
}: UseReportExportsProps) {

  // -----------------------------------------
  // ALWAYS RUN HOOKS — NEVER CONDITIONAL
  // -----------------------------------------

  const loadPngAsBase64 = useCallback(async (path: string) => {
    try {
      const res = await fetch(path);
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return undefined;
    }
  }, []);

  // Precompute contribution rows (even if unused)
  const contributionRows = useMemo(() => {
    return mapToContributionRows(filteredContributions, members);
  }, [filteredContributions, members]);

  const contributionExportRows = useMemo(() => {
    if (contributionUseGroupedView) {
      return contributionBreakdownRows.map((row) => ({
        group: row.label,
        totalAmount: row.totalAmount,
        contributionCount: row.contributionCount,
        averageAmount: row.averageAmount,
      }));
    }

    if (selectedFields.length === 0) {
      return contributionRows.map((row) => ({
        memberName: row.memberName,
        amount: row.amount,
        date: row.date,
        category: row.category,
        contributionType: row.contributionType,
        notes: row.notes,
      }));
    }

    return reduceContributionRowsForExport(contributionRows, selectedFields);
  }, [
    contributionUseGroupedView,
    contributionBreakdownRows,
    contributionRows,
    selectedFields,
  ]);

  const contributionFieldsForExport = useMemo(() => {
    if (contributionUseGroupedView) {
      return ["group", "totalAmount", "contributionCount", "averageAmount"];
    }

    if (selectedFields.length > 0) return selectedFields;
    return ["memberName", "amount", "date", "category", "contributionType", "notes"];
  }, [contributionUseGroupedView, selectedFields]);

  const contributionFieldLabelOverrides = useMemo(() => {
    if (contributionUseGroupedView) {
      const breakdownLabel =
        contributionBreakdown.charAt(0).toUpperCase() + contributionBreakdown.slice(1);

      return {
        ...(contributionExportContext?.fieldLabelOverrides ?? {}),
        group: breakdownLabel,
        totalAmount: "Total Amount",
        contributionCount: "Contributions",
        averageAmount: "Average Gift",
      };
    }

    return contributionExportContext?.fieldLabelOverrides;
  }, [
    contributionUseGroupedView,
    contributionBreakdown,
    contributionExportContext?.fieldLabelOverrides,
  ]);

  // -----------------------------------------
  // EXPORT PDF
  // -----------------------------------------
  const exportPDF = useCallback(async () => {
    const logoBase64 = await loadPngAsBase64("/FAITH_CONNECT_FLAME_LOGO.png");

    if (reportType === "members") {
      generateMembersPDF(filteredMembers, selectedFields, logoBase64);
      return;
    }

    if (reportType === "contributions") {
      generateContributionsPDF(
        contributionExportRows,
        contributionFieldsForExport,
        logoBase64,
        {
          contextLines: contributionExportContext?.contextLines,
          fieldLabelOverrides: contributionFieldLabelOverrides,
        }
      );
      return;
    }

    if (reportType === "attendance") {
      generateAttendancePDF(filteredAttendance, logoBase64);
    }
  }, [
    reportType,
    filteredMembers,
    filteredAttendance,
    selectedFields,
    loadPngAsBase64,
    contributionExportRows,
    contributionFieldsForExport,
    contributionExportContext,
    contributionFieldLabelOverrides,
  ]);

  // -----------------------------------------
  // EXPORT EXCEL
  // -----------------------------------------
  const exportExcel = useCallback(() => {
    if (reportType === "members") {
      generateMembersExcel(filteredMembers, selectedFields);
      return;
    }

    if (reportType === "contributions") {
      generateContributionsExcel(
        contributionExportRows,
        contributionFieldsForExport,
        {
          contextLines: contributionExportContext?.contextLines,
          fieldLabelOverrides: contributionFieldLabelOverrides,
        }
      );
      return;
    }

    if (reportType === "attendance") {
      generateAttendanceExcel(filteredAttendance);
    }
  }, [
    reportType,
    filteredMembers,
    filteredAttendance,
    selectedFields,
    contributionExportRows,
    contributionFieldsForExport,
    contributionExportContext,
    contributionFieldLabelOverrides,
  ]);

  return {
    exportPDF,
    exportExcel,
    loadPngAsBase64,
  };
}
