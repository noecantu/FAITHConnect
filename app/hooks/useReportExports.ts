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
}

export function useReportExports({
  reportType,
  filteredMembers,
  filteredContributions,
  filteredAttendance,
  selectedFields,
  members,
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
      generateContributionsPDF(contributionExportRows, selectedFields, logoBase64);
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
      generateContributionsExcel(contributionExportRows, selectedFields);
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
  ]);

  return {
    exportPDF,
    exportExcel,
    loadPngAsBase64,
  };
}
