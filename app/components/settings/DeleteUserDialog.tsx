'use client';

import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { TriangleAlert } from 'lucide-react';
import type { AppUser } from '@/app/lib/types';

interface Props {
  user: AppUser;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteUserDialog({ user, onCancel, onConfirm, isDeleting }: Props) {
  return (
    <Card className="bg-black/80 border-red-500/40 backdrop-blur-xl p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-red-500/10 border border-red-500/30 p-2 flex-shrink-0">
          <TriangleAlert className="h-4 w-4 text-red-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Delete User Account</h2>
          <p className="text-sm text-muted-foreground mt-1">
            This will permanently delete the account for{' '}
            <span className="font-medium text-foreground">{user.email}</span>.
            This action cannot be undone.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onConfirm}
          disabled={isDeleting}
          className="w-full sm:w-auto"
        >
          {isDeleting ? 'Deleting…' : 'Delete Account'}
        </Button>
      </div>
    </Card>
  );
}
