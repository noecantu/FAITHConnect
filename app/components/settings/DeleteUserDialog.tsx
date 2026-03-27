'use client';

import { Button } from '@/app/components/ui/button';
import type { User } from '@/app/lib/types';

interface Props {
  user: User;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteUserDialog({ user, onCancel, onConfirm, isDeleting }: Props) {
  return (
    <div className="space-y-4 border border-red-300 rounded-md p-4 bg-red-50">
      <h2 className="text-lg font-semibold text-red-700">Delete User Account</h2>

      <p className="text-sm text-red-800">
        This will permanently delete the login for{' '}
        <span className="font-semibold">{user.email}</span>.
      </p>

      <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>

        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={isDeleting}
          className="w-full sm:w-auto"
        >
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </Button>
      </div>
    </div>
  );
}
