'use client';

import { useCallback } from 'react';
import { Member, Contribution, Address } from '../lib/types';

import {
  generateMembersPDF,
  generateMembersExcel,
  generateContributionsPDF,
  generateContributionsExcel
} from '../lib/reports';

interface UseReportExportsProps {
  reportType: 'members' | 'contributions';
  filteredMembers: Member[];
  filteredContributions: Contribution[];
  selectedFields: string[];
}

export function useReportExports({
  reportType,
  filteredMembers,
  filteredContributions,
  selectedFields,
}: UseReportExportsProps) {

  /**
   * Convert PNG to Base64 for PDF header logo
   */
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

  /**
   * Format fields for preview + export
   */
    type FieldValue =
    | string
    | number
    | null
    | undefined
    | string[]
    | Address
    | { type?: string }[];

    const formatField = useCallback((value: FieldValue): string => {
    if (value == null) return "—";

    // Arrays of primitives
    if (Array.isArray(value) && value.every(v => typeof v === "string")) {
        return value.join(", ");
    }

    // Address object
    if (typeof value === "object" && "street" in value) {
        const addr = value as Address;
        return [
        addr.street,
        addr.city,
        addr.state,
        addr.zip
        ].filter(Boolean).join(", ");
    }

    // Array of relationship objects
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
        return value.map(r => r.type ?? "—").join(", ");
    }

    return String(value);
    }, []);

  /**
   * Export PDF
   */
  const exportPDF = useCallback(async () => {
    const logoBase64 = await loadPngAsBase64("/FAITH_CONNECT_FLAME_LOGO.png");

    if (reportType === "members") {
      generateMembersPDF(filteredMembers, selectedFields, logoBase64);
    } else {
      generateContributionsPDF(filteredContributions, logoBase64);
    }
  }, [
    reportType,
    filteredMembers,
    filteredContributions,
    selectedFields,
    loadPngAsBase64,
  ]);

  /**
   * Export Excel
   */
  const exportExcel = useCallback(() => {
    if (reportType === "members") {
      generateMembersExcel(filteredMembers, selectedFields);
    } else {
      generateContributionsExcel(filteredContributions);
    }
  }, [
    reportType,
    filteredMembers,
    filteredContributions,
    selectedFields,
  ]);

  return {
    exportPDF,
    exportExcel,
    formatField,
    loadPngAsBase64,
  };
}
