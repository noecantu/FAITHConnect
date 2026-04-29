'use client';

import { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { deleteSetList } from '@/app/lib/setlists';
import { useChurchId } from '@/app/hooks/useChurchId';
import { SetList } from '@/app/lib/types';
import { useRouter } from "next/navigation";
import { useToast } from '@/app/hooks/use-toast';
import { AlertDialogAction, AlertDialogCancel } from '@radix-ui/react-alert-dialog';

export function SetListDeleteDialog({ setList }: { setList: SetList }) {
  const [open, setOpen] = useState(false);
  const { churchId } = useChurchId();
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!churchId) return;
    try {
      await deleteSetList(churchId, setList.id);
      toast({
        title: 'Set List Deleted',
        description: `"${setList.title}" has been removed.`,
      });
      setOpen(false);
      router.push(`/church/${churchId}/music/setlists`);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error && error.message
            ? error.message
            : 'Could not delete set list.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Delete
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Set List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {`"${setList.title}"`}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
