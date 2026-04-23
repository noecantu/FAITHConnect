'use client';

import { Checkbox } from '@/app/components/ui/checkbox';
import {
  Role,
  CHURCH_ROLES,
  SYSTEM_ROLES,
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
  const churchRoles = [...CHURCH_ROLES].sort((a, b) => {
    if (a === 'Admin') return -1;
    if (b === 'Admin') return 1;
    return ROLE_LABELS[a].localeCompare(ROLE_LABELS[b]);
  });

  return (
    <div className="space-y-0">
      {/* Church Roles */}
      <div className="space-y-2 border border-white/10 rounded-md p-3">
        <p className="text-sm text-muted-foreground">Church Roles</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {churchRoles.map((role) => (
            <div key={role} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedRoles.includes(role)}
                onCheckedChange={(checked) =>
                  onChange(role, Boolean(checked))
                }
                disabled={!canAssignRoles}
              />
              <span>{ROLE_LABELS[role]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Roles (Root Admin only) */}
      {isRootAdmin && (
        <div className="space-y-2 border border-white/10 rounded-md p-3">
          <p className="text-sm text-muted-foreground">System Roles</p>

          {SYSTEM_ROLES.map((role) => (
            <div key={role} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedRoles.includes(role as Role)}
                onCheckedChange={(checked) =>
                  onChange(role as Role, Boolean(checked))
                }
                disabled={!canAssignRoles || isSelf}
              />
              <span>{ROLE_LABELS[role]}</span>
            </div>
          ))}

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
