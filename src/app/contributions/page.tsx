'use client';

import * as React from 'react';

import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { useToast } from '@/hooks/use-toast';
import { ContributionChart } from '@/app/contributions/contribution-chart';
// import { ContributionSummary } from '@/app/contributions/contribution-summary';
import { ContributionsTable } from '@/app/contributions/contributions-table';
import { getColumns } from '@/app/contributions/columns';
import { EditContributionDialog } from '@/app/contributions/edit-contribution-dialog';
import { AddContributionDialog } from '@/app/contributions/add-contribution-dialog';
import { getContributionSummaryText } from "@/app/contributions/contribution-summary";

// MUI theme
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { useChurchId } from '@/hooks/useChurchId';
import {
  listenToContributions,
  deleteContribution,
} from '@/lib/contributions';
import { listenToMembers } from '@/lib/members';
import { useUserRoles } from '@/hooks/useUserRoles';

import type { Contribution, Member } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEffect, useMemo, useState } from 'react';
import { Fab } from '@/components/ui/fab';
import { useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/useAuth";
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ------------------------------
// Page Component
// ------------------------------
export default function ContributionsPage() {
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();
  const churchId = useChurchId();
  const [contributions, setContributions] = React.useState<Contribution[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingContribution, setEditingContribution] = React.useState<Contribution | null>(null);
  const [deletingContribution, setDeletingContribution] = React.useState<Contribution | null>(null);
  const { isFinance } = useUserRoles(churchId);
  const { fiscalYear } = useSettings();
  const { user } = useAuth();

  const filteredContributions = useMemo(() => {
    if (fiscalYear === "all") return contributions;

    return contributions.filter(c => {
      const year = new Date(c.date).getFullYear();
      return year === Number(fiscalYear);
    });
  }, [contributions, fiscalYear]);  
  const summaryText = getContributionSummaryText(filteredContributions, fiscalYear);
  
  async function handleFiscalYearChange(value: string) {
    if (!user?.uid) return;
  
    await updateDoc(doc(db, "users", user.uid), {
      "settings.fiscalYear": value,
      updatedAt: serverTimestamp(),
    });
  }
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Listen to contributions
  React.useEffect(() => {
    if (!churchId) return;
    const unsubscribe = listenToContributions(churchId, setContributions);
    return () => unsubscribe();
  }, [churchId]);

  // Listen to members
  React.useEffect(() => {
    if (!churchId) return;
    const unsubscribe = listenToMembers(churchId, setMembers);
    return () => unsubscribe();
  }, [churchId]);

  const handleDelete = async () => {
    if (!churchId || !deletingContribution) return;

    try {
      await deleteContribution(churchId, deletingContribution.id);
      toast({
        title: 'Contribution Deleted',
        description: 'The contribution has been successfully deleted.',
      });
      setDeletingContribution(null);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error deleting contribution',
        description: (error as Error).message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const columns = React.useMemo(
    () => getColumns(setEditingContribution, setDeletingContribution),
    []
  );

  const darkTheme = createTheme({
    palette: { mode: 'dark' },
  });

  if (!isClient) {
    return null;
  }

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

      <div className="grid gap-8">
        {/* Full-width Chart */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Contribution Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
          <ContributionChart data={filteredContributions} />
          </CardContent>
        </Card>
      </div>

      {/* Full-width table */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>All Contributions</CardTitle>
          </CardHeader>
          <CardContent>
          <ContributionsTable columns={columns} data={filteredContributions} />
          </CardContent>
        </Card>
      </div>

      <AddContributionDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        members={members}
        churchId={churchId}
      />

      <EditContributionDialog
        isOpen={!!editingContribution}
        onClose={() => setEditingContribution(null)}
        contribution={editingContribution}
        members={members}
      />

      <AlertDialog
        open={!!deletingContribution}
        onOpenChange={() => setDeletingContribution(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              contribution record for {deletingContribution?.memberName}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isFinance && (
        <Fab
          type="add"
          onClick={() => setIsAddDialogOpen(true)}
        />
      )}

    </ThemeProvider>
  );
}
