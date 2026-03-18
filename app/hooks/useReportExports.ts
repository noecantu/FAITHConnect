'use client';

import { useCallback } from 'react';
import { Member, Contribution, Address, AttendanceRecord } from '@/app/lib/types';

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
  members: Member[]; // needed for mapping
}

export function useReportExports({
  reportType,
  filteredMembers,
  filteredContributions,
  filteredAttendance,
  selectedFields,
  members,
}: UseReportExportsProps) {

  // Convert PNG to Base64 for PDF header logo
  const loadPngAsBase64 = useCallback(async (path: string): Promise<string | undefined> => {
    try {
      const res = await fetch(path);
      const blob = await res.blob();

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return undefined;
    }
  }, []);

  // Export PDF
  const exportPDF = useCallback(async () => {
    const logoBase64 = await loadPngAsBase64("/FAITH_CONNECT_FLAME_LOGO.png");

    if (reportType === "members") {
      generateMembersPDF(filteredMembers, selectedFields, logoBase64);
      return;
    }

    if (reportType === "contributions") {
      const rows = mapToContributionRows(filteredContributions, members);
      const exportRows = reduceContributionRowsForExport(rows, selectedFields);
      generateContributionsPDF(exportRows, selectedFields, logoBase64);
      return;
    }

    if (reportType === "attendance") {
      generateAttendancePDF(filteredAttendance, logoBase64);
    }
  }, [
    reportType,
    filteredMembers,
    filteredContributions,
    filteredAttendance,
    selectedFields,
    members,
    loadPngAsBase64,
  ]);

  // Export Excel
  const exportExcel = useCallback(() => {
    if (reportType === "members") {
      generateMembersExcel(filteredMembers, selectedFields);
      return;
    }

    if (reportType === "contributions") {
      const rows = mapToContributionRows(filteredContributions, members);
      const exportRows = reduceContributionRowsForExport(rows, selectedFields);
      generateContributionsExcel(exportRows, selectedFields);
      return;
    }

    if (reportType === "attendance") {
      generateAttendanceExcel(filteredAttendance);
    }
  }, [
    reportType,
    filteredMembers,
    filteredContributions,
    filteredAttendance,
    selectedFields,
    members,
  ]);

  return {
    exportPDF,
    exportExcel,
    loadPngAsBase64,
  };
}
