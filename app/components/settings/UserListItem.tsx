'use client';

import { ROLE_LABELS } from "@/app/lib/auth/roles";
import type { AppUser } from '@/app/lib/types';

interface Props {
  user: AppUser;
  onClick: () => void;
}

export default function UserListItem({ user, onClick }: Props) {
  const roles = user.roles ?? [];
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
        {roles.length
          ? roles.map((r) => ROLE_LABELS[r]).join(', ')
          : 'No roles assigned'}
      </p>
    </button>
  );
}
