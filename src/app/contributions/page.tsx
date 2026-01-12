'use client';

import * as React from 'react';
import { doc, getDoc } from 'firebase/firestore';
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
import { ContributionSummary } from '@/app/contributions/contribution-summary';
import { ContributionsTable } from '@/app/contributions/contributions-table';
import { getColumns } from '@/app/contributions/columns';
import { EditContributionDialog } from '@/app/contributions/edit-contribution-dialog';
import { AddContributionDialog } from '@/app/contributions/add-contribution-dialog';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useAuth } from '@/hooks/useAuth';
import { useChurchId } from '@/hooks/useChurchId';
import { db } from '@/lib/firebase';
import {
  listenToContributions,
  deleteContribution,
} from '@/lib/contributions';
import { listenToMembers } from '@/lib/members';
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

// ------------------------------
// Page Component
// ------------------------------
export default function ContributionsPage() {
  const [isClient, setIsClient] = React.useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const churchId = useChurchId();
  const [contributions, setContributions] = React.useState<Contribution[]>([]);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [roles, setRoles] = React.useState<string[]>([]);
  const [canAdd, setCanAdd] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [editingContribution, setEditingContribution] = React.useState<Contribution | null>(null);
  const [deletingContribution, setDeletingContribution] = React.useState<Contribution | null>(null);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Get user roles
  React.useEffect(() => {
    const fetchUserRoles = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setRoles(userDoc.data().roles || []);
        } else {
          setRoles([]);
        }
      } else {
        setRoles([]);
      }
    };
    fetchUserRoles();
  }, [user]);

  // Determine if user can add contributions
  React.useEffect(() => {
    const hasPermission = !!(churchId && roles && (roles.includes('Admin') || roles.includes('Finance')));
    setCanAdd(hasPermission);
  }, [churchId, roles]);

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
    // Render a placeholder or null on the server and initial client render
    return null;
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <PageHeader title="Contributions" className="mb-2">
        {canAdd && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            Add Contribution
          </Button>
        )}
      </PageHeader>
      <ContributionSummary contributions={contributions} />

      <div className="grid gap-8">
        {/* Full-width Chart */}
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Contribution Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <ContributionChart data={contributions} />
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
            <ContributionsTable columns={columns} data={contributions} />
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
    </ThemeProvider>
  );
}
