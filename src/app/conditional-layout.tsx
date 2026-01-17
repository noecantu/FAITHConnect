'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import Header from '@/components/layout/header';
import { ReportDialog } from '@/components/report/ReportDialog';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import { listenToMembers } from '@/lib/members';
import { listenToContributions } from '@/lib/contributions';
import { generateMembersPDF, generateMembersExcel, generateContributionsPDF, generateContributionsExcel } from '@/lib/reports';
import type { Member, Contribution } from '@/lib/types';
import * as React from 'react';
import { useSettings } from '@/hooks/use-settings';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const churchId = useChurchId();
  const { isAdmin } = useUserRoles(churchId);
  const { fiscalYear } = useSettings();

  const [members, setMembers] = React.useState<Member[]>([]);
  const [contributions, setContributions] = React.useState<Contribution[]>([]);
  const [reportType, setReportType] = React.useState<'members' | 'contributions' | null>(null);

  // Data Listeners for Reports, always active if admin
  React.useEffect(() => {
    if (isAdmin && churchId) {
      // Fetch ALL data without pre-filtering
      const unsubMembers = listenToMembers(churchId, setMembers);
      const unsubContributions = listenToContributions(churchId, setContributions);
      
      return () => {
        unsubMembers();
        unsubContributions();
      };
    }
  }, [isAdmin, churchId]);

  const handleExport = (format: 'pdf' | 'excel', memberId: string) => {
    if (reportType === 'members') {
      // Member reports are not filtered
      if (format === 'pdf') generateMembersPDF(members);
      if (format === 'excel') generateMembersExcel(members);
    } 
    else if (reportType === 'contributions') {
      // 1. Filter by fiscal year first
      const yearFilteredContributions = fiscalYear === 'all'
        ? contributions
        : contributions.filter(c => new Date(c.date).getFullYear().toString() === fiscalYear);
      
      // 2. Then, filter by selected member
      const finalContributions = memberId === 'all'
        ? yearFilteredContributions
        : yearFilteredContributions.filter(c => c.memberId === memberId);

      // 3. Generate the report with the final filtered list
      if (format === 'pdf') generateContributionsPDF(finalContributions);
      if (format === 'excel') generateContributionsExcel(finalContributions);
    }
    setReportType(null); // Close dialog after export
  };

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <>
      <div className="flex min-h-screen w-full flex-col">
        <Header setReportType={setReportType} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </div>
      <ReportDialog
        open={!!reportType}
        onOpenChange={() => setReportType(null)}
        title={reportType === 'members' ? 'Members' : 'Contributions'}
        members={members}
        onPDF={(memberId) => handleExport('pdf', memberId)}
        onExcel={(memberId) => handleExport('excel', memberId)}
      />
    </>
  );
}
