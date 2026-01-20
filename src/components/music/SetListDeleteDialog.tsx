'use client';

import { useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteSetList } from '@/lib/setlists';
import { useChurchId } from '@/hooks/useChurchId';
import { SetList } from '@/lib/types';

export function SetListDeleteDialog({ setList }: { setList: SetList }) {
  const [open, setOpen] = useState(false);
  const churchId = useChurchId();

  const handleDelete = async () => {
    if (!churchId) return;
    await deleteSetList(churchId, setList.id);
    setOpen(false);
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
              Are you sure you want to delete "{setList.title}"? This action cannot be undone.
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
