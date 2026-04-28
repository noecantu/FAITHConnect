'use client';

import { ROLE_LABELS } from '@/app/lib/auth/roles';
import { can } from '@/app/lib/auth/permissions';
import type { AppUser } from '@/app/lib/types';
import type { Role } from '@/app/lib/auth/roles';
import type { Permission } from '@/app/lib/auth/permissions';

interface Props {
  user: AppUser;
  onClick: () => void;
  isBillingOwner?: boolean;
}

const ACCESS_BADGES: { label: string; viewPerm: Permission; editPerm: Permission }[] = [
  { label: 'Attendance',    viewPerm: 'attendance.read',    editPerm: 'attendance.manage'    },
  { label: 'Calendar',      viewPerm: 'events.read',        editPerm: 'events.manage'        },
  { label: 'Contributions', viewPerm: 'contributions.read', editPerm: 'contributions.manage' },
  { label: 'Members',       viewPerm: 'members.read',       editPerm: 'members.manage'       },
  { label: 'Music',         viewPerm: 'music.read',         editPerm: 'music.manage'         },
  { label: 'Service Plans', viewPerm: 'servicePlans.read',  editPerm: 'servicePlans.manage'  },
];

export default function UserListItem({ user, onClick, isBillingOwner = false }: Props) {
  const roles = (user.roles ?? []) as Role[];
  const grants = (user.permissions ?? []) as Permission[];
  const isAdmin = roles.includes('Admin');

  // Compute which modules are accessible
  const accessedModules = ACCESS_BADGES.filter(({ viewPerm, editPerm }) =>
    can(roles, viewPerm, grants) || can(roles, editPerm, grants)
  );

  const primaryRole = roles.find((r) => ROLE_LABELS[r]) ?? null;

  return (
    <button
      onClick={onClick}
      className="
        w-full text-left
        p-4 rounded-md border border-white/10 bg-white/[0.03]
        hover:bg-white/[0.07] hover:border-white/20 transition
        focus:outline-none focus:ring-2 focus:ring-primary
        space-y-2
      "
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">
            {(`${user.firstName ?? ''} ${user.lastName ?? ''}`).trim() || user.email}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        {isBillingOwner && (
          <span className="flex-shrink-0 inline-flex items-center rounded-full border border-cyan-300/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
            Billing Owner
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {primaryRole && (
          <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {ROLE_LABELS[primaryRole]}
          </span>
        )}

        {isAdmin && (
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            Full Access
          </span>
        )}

        {!isAdmin && accessedModules.length > 0 && accessedModules.map(({ label }) => (
          <span
            key={label}
            className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-muted-foreground"
          >
            {label}
          </span>
        ))}

        {!isAdmin && accessedModules.length === 0 && !primaryRole && (
          <span className="text-[10px] text-muted-foreground/50 italic">No access assigned</span>
        )}
      </div>
    </button>
  );
}

