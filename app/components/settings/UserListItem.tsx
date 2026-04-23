'use client';

import { ROLE_LABELS } from "@/app/lib/auth/roles";
import type { AppUser } from '@/app/lib/types';

interface Props {
  user: AppUser;
  onClick: () => void;
  isBillingOwner?: boolean;
}

export default function UserListItem({ user, onClick, isBillingOwner = false }: Props) {
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
      <div className="flex items-center gap-2">
        <p className="font-semibold">
          {(user.firstName ?? '') + ' ' + (user.lastName ?? '')}
        </p>
        {isBillingOwner && (
          <span className="inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
            Billing Owner
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground">{user.email}</p>

      <p className="text-xs text-muted-foreground">
        {roles.length
          ? roles.map((r) => ROLE_LABELS[r]).join(', ')
          : 'No roles assigned'}
      </p>
    </button>
  );
}
