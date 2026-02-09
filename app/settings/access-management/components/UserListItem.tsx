'use client';

import { ROLE_MAP } from '@/app/lib/roles';
import type { User } from '@/app/lib/types';

interface Props {
  user: User;
  onClick: () => void;
}

export default function UserListItem({ user, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="
        w-full text-left
        p-4 rounded-md border bg-muted/20
        hover:bg-muted transition
        focus:outline-none focus:ring-2 focus:ring-primary
      "
    >
      <p className="font-semibold">
        {(user.firstName ?? '') + ' ' + (user.lastName ?? '')}
      </p>

      <p className="text-sm text-muted-foreground">{user.email}</p>

      <p className="text-xs text-muted-foreground">
        {user.roles.length
          ? user.roles.map((r) => ROLE_MAP[r]).join(', ')
          : 'No roles assigned'}
      </p>
    </button>
  );
}
