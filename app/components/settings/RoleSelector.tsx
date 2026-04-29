'use client';

import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Role,
  NON_CHURCH_ROLES,
  ROLE_LABELS,
} from '@/app/lib/auth/roles';
import { can } from '@/app/lib/auth/permissions';

interface Props {
  selectedRoles: Role[];
  onChange: (role: Role, checked: boolean) => void;

  currentUserId: string;
  currentUserRoles: Role[];
  targetUserId: string;
}

type RoleGroup = { label: string; roles: Role[] };

const CHURCH_ROLE_GROUPS: RoleGroup[] = [
  {
    label: 'Administration',
    roles: ['Admin', 'Finance', 'MemberManager', 'AttendanceManager', 'EventManager', 'ServiceManager'],
  },
  {
    label: 'Pastoral & Music',
    roles: ['Pastor', 'Minister', 'Deacon', 'MusicManager', 'MusicMember'],
  },
  {
    label: 'Operations',
    roles: ['UsherManager', 'Usher', 'CaretakerManager', 'Caretaker'],
  },
  {
    label: 'Groups',
    roles: ['MensGroupManager', 'MensGroup', 'WomensGroupManager', 'WomensGroup', 'YouthGroupManager', 'YouthGroup', 'GroupManager'],
  },
  {
    label: 'General',
    roles: ['Member'],
  },
];

function RoleCheckbox({
  role,
  checked,
  disabled,
  onChange,
}: {
  role: Role;
  checked: boolean;
  disabled: boolean;
  onChange: (role: Role, checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none group">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(role, Boolean(v))}
        disabled={disabled}
      />
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition">
        {ROLE_LABELS[role]}
      </span>
    </label>
  );
}

export default function RoleSelector({
  selectedRoles,
  onChange,
  currentUserId,
  currentUserRoles,
  targetUserId,
}: Props) {
  const canAssignRoles = can(currentUserRoles, 'roles.assign');
  const isRootAdmin = currentUserRoles.includes('RootAdmin');
  const isSelf = currentUserId === targetUserId;

  return (
    <div className="space-y-3">
      {/* Church Role Groups */}
      <div className="border border-white/10 rounded-md divide-y divide-white/5">
        {CHURCH_ROLE_GROUPS.map((group) => (
          <div key={group.label} className="px-3 py-2.5 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
              {group.roles.map((role) => (
                <RoleCheckbox
                  key={role}
                  role={role}
                  checked={selectedRoles.includes(role)}
                  disabled={!canAssignRoles}
                  onChange={onChange}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Non-church admin roles (Root Admin only) */}
      {isRootAdmin && (
        <div className="border border-white/10 rounded-md px-3 py-2.5 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            Platform Roles
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
            {NON_CHURCH_ROLES.map((role) => (
              <RoleCheckbox
                key={role}
                role={role as Role}
                checked={selectedRoles.includes(role as Role)}
                disabled={!canAssignRoles || isSelf}
                onChange={onChange}
              />
            ))}
          </div>
          {isSelf && (
            <p className="text-xs text-muted-foreground">
              You cannot change your own system-level roles.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

