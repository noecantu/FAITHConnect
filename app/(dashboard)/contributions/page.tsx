'use client';

import { PageHeader } from '@/app/components/page-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/app/components/ui/card';

import { ContributionChart } from '@/app/components/contributions/ContributionChart';
import { ContributionsTable } from '@/app/components/contributions/ContributionsTable';
import { getColumns } from '@/app/components/contributions/Columns';
import { EditContributionDialog } from '@/app/components/contributions/EditContributionDialog';
import { AddContributionDialog } from '@/app/components/contributions/AddContributionDialog';
import { getContributionSummaryText } from "@/app/components/contributions/ContributionSummary";

import { ThemeProvider, createTheme } from '@mui/material/styles';

import { useChurchId } from '@/app/hooks/useChurchId';
import { listenToContributions } from '@/app/lib/contributions';
import { listenToMembers } from '@/app/lib/members';
import { useUserRoles } from '@/app/hooks/useUserRoles';

import type { Contribution, Member } from '@/app/lib/types';

import { useEffect, useMemo, useState } from 'react';
import { Fab } from '@/app/components/ui/fab';
import { useSettings } from "@/app/hooks/use-settings";
import { useAuth } from "@/app/hooks/useAuth";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import React from 'react';

// ------------------------------
// Page Component
// ------------------------------
export default function ContributionsPage() {
  const [isClient, setIsClient] = useState(false);
  const { churchId } = useChurchId();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // NEW: row-click edit dialog state
  const [selected, setSelected] = React.useState<Contribution | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { isFinance } = useUserRoles(churchId);
  const { fiscalYear } = useSettings();
  const { user } = useAuth();

  // Filter by fiscal year
  const filteredContributions = useMemo(() => {
    if (fiscalYear === "all") return contributions;

    return contributions.filter(c => {
      const year = new Date(c.date).getFullYear();
      return year === Number(fiscalYear);
    });
  }, [contributions, fiscalYear]);

  const summaryText = getContributionSummaryText(filteredContributions, fiscalYear);

  // Row click → open edit dialog
  function handleRowClick(contribution: Contribution) {
    setSelected(contribution);
    setIsDialogOpen(true);
  }

  async function handleFiscalYearChange(value: string) {
    if (!user?.id) return;

    await updateDoc(doc(db, "users", user.id), {
      "settings.fiscalYear": value,
      updatedAt: serverTimestamp(),
    });
  }

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Listen to contributions
  useEffect(() => {
    if (!churchId) return;

    const unsubscribe = listenToContributions(churchId, setContributions);
    return () => unsubscribe();
  }, [churchId]);

  // Listen to members
  useEffect(() => {
    if (!churchId) return;

    const unsubscribe = listenToMembers(churchId, setMembers);
    return () => unsubscribe();
  }, [churchId]);

  // Columns WITHOUT edit/delete icons
  const columns = useMemo(() => getColumns(), []);

  const darkTheme = createTheme({
    palette: { mode: 'dark' },
  });

  if (!isClient) return null;

  return (
    <ThemeProvider theme={darkTheme}>
      <PageHeader
        title="Contributions"
        subtitle={summaryText}
        className="mb-2"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">
            Fiscal Year
          </span>

          <Select value={fiscalYear} onValueChange={handleFiscalYearChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>

              {Array.from(new Set(contributions.map(c =>
                new Date(c.date).getFullYear()
              )))
                .sort((a, b) => b - a)
                .map(year => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {/* Chart */}
      <div className="grid gap-8">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Contribution Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <ContributionChart data={filteredContributions} />
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>All Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <ContributionsTable
              columns={columns}
              data={filteredContributions}
              onRowClick={handleRowClick}
            />
          </CardContent>
        </Card>
      </div>

      {/* Add Contribution */}
      <AddContributionDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        members={members}
        churchId={churchId}
      />

      {/* Edit Contribution */}
      <EditContributionDialog
        contribution={selected}
        members={members}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />

      {isFinance && (
        <Fab
          type="add"
          onClick={() => setIsAddDialogOpen(true)}
        />
      )}
    </ThemeProvider>
  );
}
