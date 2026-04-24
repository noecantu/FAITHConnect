'use client';

import { useCallback, useMemo } from 'react';
import { Member, Contribution, AttendanceRecord } from '@/app/lib/types';

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
  };
}

export function useReportExports({
  reportType,
  filteredMembers,
  filteredContributions,
  filteredAttendance,
  selectedFields,
  members,
  contributionExportContext,
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
    return reduceContributionRowsForExport(contributionRows, selectedFields);
  }, [contributionRows, selectedFields]);

  const contributionFieldsForExport = useMemo(() => {
    if (selectedFields.length > 0) return selectedFields;
    return ["memberName", "date", "amount", "category", "contributionType", "notes"];
  }, [selectedFields]);

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
        contributionExportContext
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
        contributionExportContext
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
  ]);

  return {
    exportPDF,
    exportExcel,
    loadPngAsBase64,
  };
}
