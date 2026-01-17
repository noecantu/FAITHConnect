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
import { useSettings } from '@/components/settings-provider';

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
      const unsubMembers = listenToMembers(churchId, setMembers);
      const unsubContributions = listenToContributions(churchId, (data) => {
        if (fiscalYear === 'all') {
            setContributions(data);
        } else {
            const filtered = data.filter(c => new Date(c.date).getFullYear().toString() === fiscalYear);
            setContributions(filtered);
        }
      });
      
      return () => {
        unsubMembers();
        unsubContributions();
      };
    }
  }, [isAdmin, churchId, fiscalYear]);

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
        onPDF={() => {
            if (reportType === 'members') generateMembersPDF(members);
            if (reportType === 'contributions') generateContributionsPDF(contributions);
            setReportType(null);
        }}
        onExcel={() => {
            if (reportType === 'members') generateMembersExcel(members);
            if (reportType === 'contributions') generateContributionsExcel(contributions);
            setReportType(null);
        }}
      />
    </>
  );
}
